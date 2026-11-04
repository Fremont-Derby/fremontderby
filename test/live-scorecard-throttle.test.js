import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { liveRackLedgerAdapterSource } from '../src/liveRackLedgerAdapter.js';
import { sharedRackLedgerScorecardControllerSource } from '../src/rackLedgerScorecard.js';

function adapterWithResponse(response) {
  let calls = 0;
  const removed = [];
  const context = {
    URLSearchParams,
    location: { search: '?match=match-1&team=team-a' },
    sessionStorage: {
      getItem: () => 'test-session',
      removeItem: (key) => removed.push(key),
    },
    document: { querySelector: () => null },
    window: {},
    fetch: async () => { calls += 1; return response; },
  };
  vm.runInNewContext(liveRackLedgerAdapterSource, context);
  return { adapter: context.window.fdRackLedgerAdapter, calls: () => calls, removed };
}

test('live score mutation respects Retry-After without automatically replaying a rejected rack', async () => {
  const { adapter, calls } = adapterWithResponse({
    status: 429,
    ok: false,
    headers: { get: (name) => name === 'retry-after' ? '10' : null },
    json: async () => { throw new SyntaxError('Cloudflare HTML response'); },
  });
  await assert.rejects(adapter.saveRack({ winnerSide: 'A' }), (error) => {
    assert.equal(error.status, 429);
    assert.equal(error.retryAfterSeconds, 10);
    assert.match(error.message, /Wait 10 seconds, then check the latest rack before retrying/);
    return true;
  });
  assert.equal(calls(), 1);
});

test('missing Retry-After has a bounded recovery wait and existing sign-in recovery remains intact', async () => {
  const throttled = adapterWithResponse({
    status: 429,
    ok: false,
    headers: { get: () => null },
    json: async () => ({}),
  });
  await assert.rejects(throttled.adapter.undo(), (error) => {
    assert.equal(error.retryAfterSeconds, 15);
    return true;
  });
  const expired = adapterWithResponse({
    status: 401,
    ok: false,
    headers: { get: () => null },
    json: async () => ({}),
  });
  await assert.rejects(expired.adapter.confirm(), /sign-in expired/i);
  assert.deepEqual(expired.removed, ['fd.accessToken']);
});

test('HTTP-date Retry-After and ordinary conflict responses retain distinct recovery paths', async () => {
  const retryAt = new Date(Date.now() + 30_000).toUTCString();
  const throttled = adapterWithResponse({
    status: 429,
    ok: false,
    headers: { get: () => retryAt },
    json: async () => ({}),
  });
  await assert.rejects(throttled.adapter.saveRack({ winnerSide: 'B' }), (error) => {
    assert.equal(error.status, 429);
    assert.ok(error.retryAfterSeconds >= 28 && error.retryAfterSeconds <= 30);
    return true;
  });
  const conflict = adapterWithResponse({
    status: 409,
    ok: false,
    headers: { get: () => null },
    json: async () => ({ error: 'Score changed on another device' }),
  });
  await assert.rejects(conflict.adapter.saveRack({ winnerSide: 'A' }), (error) => {
    assert.equal(error.status, 409);
    assert.equal(error.message, 'Score changed on another device');
    return true;
  });
});

test('background refresh is paced, avoids overlap, and backs off without replaying foreground mutations', () => {
  const source = sharedRackLedgerScorecardControllerSource;
  assert.match(source, /refreshIntervalMs=15000/);
  assert.match(source, /refreshInFlight\|\|foregroundInFlight\|\|Date\.now\(\)<nextRefreshAt/);
  assert.match(source, /error\.status===429/);
  assert.match(source, /error\.retryAfterSeconds/);
  assert.match(source, /Scorecard is temporarily busy/);
  assert.match(source, /Then use Try again/);
  assert.match(source, /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'/);
  assert.doesNotMatch(source, /setInterval\([^\n]*,3000\)/);
});

test('long server cooldowns are never shortened and malformed numeric headers use fallback', async () => {
  for (const [value, expected] of [['600',600], ['0010',10], ['1e3',15], ['0x10',15], ['1.5',15], ['-1',15], ['Infinity',15], ['',15]]) {
    const { adapter, calls } = adapterWithResponse({status:429,ok:false,headers:{get:()=>value},json:async()=>({})});
    await assert.rejects(adapter.saveRack({winnerSide:'A'}), error => {
      assert.equal(error.retryAfterSeconds, expected, value);
      return true;
    });
    assert.equal(calls(), 1, value);
  }
});

test('future HTTP-date cooldown longer than two minutes is preserved', async () => {
  const retryAt = new Date(Date.now()+600_000).toUTCString();
  const { adapter, calls } = adapterWithResponse({status:429,ok:false,headers:{get:()=>retryAt},json:async()=>({})});
  await assert.rejects(adapter.confirm(), error => {
    assert.ok(error.retryAfterSeconds>=598 && error.retryAfterSeconds<=600);
    return true;
  });
  assert.equal(calls(),1);
});

test('manual scoring retries and reads cannot dispatch before server cooldown', async () => {
  const {adapter,calls}=adapterWithResponse({status:429,ok:false,headers:{get:()=> '600'},json:async()=>({})});
  for(const action of [()=>adapter.undo(),()=>adapter.confirm(),()=>adapter.load()]) {
    await assert.rejects(action(),error=>error.status===429 && error.retryAfterSeconds>=599);
  }
  assert.equal(calls(),1);
});
