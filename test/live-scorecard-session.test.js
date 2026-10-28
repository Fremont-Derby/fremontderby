import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { liveRackLedgerAdapterSource } from '../src/liveRackLedgerAdapter.js';

function deferred() {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function harness() {
  const storage = new Map([['fd.accessToken', 'session-a']]);
  const requests = []; const listeners = new Map();
  const window = { addEventListener: (name, listener) => listeners.set(name, listener) };
  vm.runInNewContext(liveRackLedgerAdapterSource, {
    window, URLSearchParams, location: { search: '?match=match&team=team' },
    document: { querySelector: () => null },
    sessionStorage: { getItem: key => storage.get(key) || '', removeItem: key => storage.delete(key) },
    fetch: (url, init) => { const result = deferred(); requests.push({ url, init, result }); return result.promise; },
  });
  return {
    adapter: window.fdRackLedgerAdapter, window, requests,
    token: () => storage.get('fd.accessToken'),
    change(token, event = 'fd:session-changed') {
      if (token) storage.set('fd.accessToken', token); else storage.delete('fd.accessToken');
      if (event) listeners.get(event)?.();
    },
  };
}
const response = (status, body = {}) => ({ status, ok: status === 200,
  headers: { get: () => '10' }, json: async () => body });
const changed = error => error.sessionChanged === true && /sign-in changed/.test(error.message);

for (const status of [200, 401, 429]) {
  test(`delayed ${status} from an earlier scoring session preserves the current sign-in`, async () => {
    const h = harness(); const pending = h.adapter.confirm();
    h.change('session-b', null);
    h.requests[0].result.resolve(response(status));
    await assert.rejects(pending, changed);
    assert.equal(h.token(), 'session-b');
    assert.equal(h.window.fdRackLedgerState, null);
    assert.equal(h.requests.length, 1);
  });
}

test('token change while parsing an old401 body cannot remove the new token', async () => {
  const h = harness(); const body = deferred(); const parsing = deferred();
  const pending = h.adapter.undo();
  h.requests[0].result.resolve({ ...response(401), json: () => { parsing.resolve(); return body.promise; } });
  await parsing.promise;
  h.change('session-b', null); body.resolve({});
  await assert.rejects(pending, changed);
  assert.equal(h.token(), 'session-b');
});

test('sign-out and same-token ABA events invalidate an in-flight mutation', async () => {
  const h = harness(); const pending = h.adapter.saveRack({ winnerSide: 'A' });
  h.change(null); h.change('session-a');
  h.requests[0].result.resolve(response(200));
  await assert.rejects(pending, changed);
  assert.equal(h.token(), 'session-a');
  assert.equal(h.requests.length, 1);
});

test('late network failure belongs to its original session and is never replayed', async () => {
  const h = harness(); const pending = h.adapter.undo();
  h.change('session-b'); h.requests[0].result.reject(new Error('Disconnected'));
  await assert.rejects(pending, changed);
  assert.equal(h.requests.length, 1);
});

test('session change blocks every scoring mutation until a complete current load', async () => {
  const h = harness(); h.change('session-b', 'focus');
  for (const [method, input] of [['saveRack', { winnerSide: 'A' }],
    ['setOpeningDiscipline', { openingDiscipline: '8-ball' }], ['undo'], ['confirm'], ['finalize']]) {
    await assert.rejects(h.adapter[method](input), changed);
  }
  assert.equal(h.requests.length, 0);
  const load = h.adapter.load();
  const racks = [{ winner_side: 'B', discipline: '8-ball' }];
  h.requests[0].result.resolve(response(200, { scorecard: { player_a_id: 'a', player_b_id: 'b' } }));
  h.requests[1].result.resolve(response(200, { comparison: { tracker_player_id: 'a', own_racks: racks } }));
  await load;
  const save = h.adapter.saveRack({ winnerSide: 'A' });
  assert.equal(h.requests[2].init.headers.authorization, 'Bearer session-b');
  assert.deepEqual(JSON.parse(h.requests[2].init.body).expectedRacks, racks);
  h.requests[2].result.resolve(response(200)); await save;
});

test('a partial old-session load cannot publish expected racks or global score state', async () => {
  const h = harness(); const load = h.adapter.load();
  h.requests[0].result.resolve(response(200, { scorecard: { player_a_id: 'old' } }));
  await Promise.resolve(); await Promise.resolve();
  h.change('session-b');
  h.requests[1].result.resolve(response(200, { comparison: { own_racks: [{ winner_side: 'A' }] } }));
  await assert.rejects(load, changed);
  assert.equal(h.window.fdRackLedgerState, null);
  await assert.rejects(h.adapter.confirm(), changed);
  assert.equal(h.requests.length, 2);
});

test('a current-session401 still expires exactly that session', async () => {
  const h = harness(); const pending = h.adapter.confirm();
  h.requests[0].result.resolve(response(401));
  await assert.rejects(pending, /sign-in expired/);
  assert.equal(h.token(), undefined);
});
