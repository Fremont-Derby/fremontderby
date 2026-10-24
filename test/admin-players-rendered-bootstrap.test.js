import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

function script() {
  const scripts = [...renderAdminPlayersPage().matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  return scripts[0][1];
}

test('admin player script compiles after rendering (duplicate-name confirmation)', () => {
  assert.doesNotThrow(() => new vm.Script(script()));
});

for (const scenario of ['admin', 'signed-out', 'denied', 'network']) {
  test(`admin player bootstrap exits loading: ${scenario}`, async () => {
    const elements = new Map();
    const element = () => ({ textContent: '', dataset: {}, hidden: true, value: '',
      addEventListener() {}, replaceChildren() {}, append() {}, setAttribute() {} });
    let calls = 0;
    const context = vm.createContext({
      document: { querySelector(selector) { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); }, createElement: element },
      sessionStorage: { getItem: () => scenario === 'signed-out' ? '' : 'test-token' },
      window: {}, location: { search: '?season=requested-season' }, URLSearchParams,
      fetch: async (url, options) => {
        calls++;
        assert.equal(url, '/api/admin/players');
        assert.equal(options.headers.authorization, 'Bearer test-token');
        if (scenario === 'network') throw new Error('Network unavailable');
        return { ok: scenario !== 'denied', status: scenario === 'denied' ? 403 : 200,
          text: async () => JSON.stringify(scenario === 'denied' ? {error: 'Admin access required'} : {players: [], rosterTeams: []}) };
      }
    });
    new vm.Script(script()).runInContext(context);
    await new Promise(resolve => setImmediate(resolve));
    const status = elements.get('[data-status]');
    assert.equal(status.textContent, {admin: '0 players loaded.', 'signed-out': 'Sign in from Profile to use league admin tools.', denied: 'Admin access required', network: 'Network unavailable'}[scenario]);
    assert.equal(calls, scenario === 'signed-out' ? 0 : 1);
    if (scenario !== 'admin') assert.equal(elements.get('[data-list]').hidden, true);
  });
}
