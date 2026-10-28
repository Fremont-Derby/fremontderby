import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

function deferred() {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const response = (status, body = {}) => ({ status, ok: status === 200,
  headers: { get: () => '10' }, json: async () => body });
function harness() {
  const nodes = new Map(); const listeners = new Map(); const requests = [];
  const storage = new Map([['fd.accessToken', 'session-a']]);
  const element = () => ({ dataset: {}, children: [], addEventListener() {},
    append(...values) { this.children.push(...values); }, replaceChildren(...values) { this.children = values; } });
  for (const key of ['status', 'list', 'filters', 'date', 'team', 'matchup', 'race']) nodes.set(key, element());
  const script = renderScorePickerPage().match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, {
    URLSearchParams, location: { search: '?match=selected-match' },
    window: { addEventListener: (name, listener) => listeners.set(name, listener) },
    document: { querySelector: selector => nodes.get(selector.slice(6, -1)), createElement: element },
    sessionStorage: { getItem: key => storage.get(key) || '', removeItem: key => storage.delete(key) },
    fetch: () => { const result = deferred(); requests.push(result); return result.promise; },
  });
  return { nodes, requests, token: () => storage.get('fd.accessToken'),
    change(value, signal = true) {
      if (value) storage.set('fd.accessToken', value); else storage.delete('fd.accessToken');
      if (signal) listeners.get('fd:session-changed')();
    } };
}

for (const status of [200, 401, 429]) {
  test(`Score picker ignores delayed old${status} without clearing a new session`, async () => {
    const h = harness(); h.change('session-b', false);
    h.requests[0].resolve(response(status)); h.requests[1].resolve(response(200)); await tick();
    assert.equal(h.token(), 'session-b');
    assert.match(h.nodes.get('status').textContent, /sign-in changed/);
    assert.equal(h.nodes.get('filters').hidden, true);
    assert.equal(h.nodes.get('team').children.length, 0);
    assert.equal(h.requests.length, 2);
  });
}

for (const bodyIndex of [0, 1]) {
  test(`session changes during body${bodyIndex + 1} cannot publish old choices`, async () => {
    const h = harness(); const body = deferred(); const parsing = deferred();
    h.requests[0].resolve(bodyIndex === 0
      ? { ...response(200), json: () => { parsing.resolve(); return body.promise; } } : response(200, { matches: [] }));
    h.requests[1].resolve(bodyIndex === 1
      ? { ...response(200), json: () => { parsing.resolve(); return body.promise; } } : response(200));
    await parsing.promise; h.change('session-b', false); body.resolve({ matches: [] }); await tick();
    assert.equal(h.token(), 'session-b');
    assert.match(h.nodes.get('status').textContent, /sign-in changed/);
    assert.equal(h.nodes.get('race').disabled, true);
    assert.equal(h.requests.length, 2);
  });
}

test('sign-out/same-token return invalidates pending choices and preserves the requested reload link', async () => {
  const h = harness(); h.change(null); h.change('session-a');
  h.requests[0].resolve(response(401)); h.requests[1].resolve(response(200)); await tick();
  assert.equal(h.token(), 'session-a');
  assert.match(h.nodes.get('status').textContent, /sign-in changed/);
  const actions = h.nodes.get('list').children[0].children[2];
  assert.equal(actions.children[0].href, '/scorecard?match=selected-match');
  assert.equal(h.requests.length, 2);
});

test('a late network failure cannot replace newer session recovery', async () => {
  const h = harness(); h.change('session-b');
  h.requests[0].reject(new Error('Old disconnect')); h.requests[1].resolve(response(200)); await tick();
  assert.equal(h.token(), 'session-b');
  assert.match(h.nodes.get('status').textContent, /sign-in changed/);
  assert.equal(h.requests.length, 2);
});

for (const index of [0, 1]) {
  test(`current401 from authorized read${index + 1} still requires sign-in`, async () => {
    const h = harness();
    h.requests[0].resolve(response(index === 0 ? 401 : 200));
    h.requests[1].resolve(response(index === 1 ? 401 : 200)); await tick();
    assert.equal(h.token(), undefined);
    assert.match(h.nodes.get('status').textContent, /sign-in expired/);
  });
}
