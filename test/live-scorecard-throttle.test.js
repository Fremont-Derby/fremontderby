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
