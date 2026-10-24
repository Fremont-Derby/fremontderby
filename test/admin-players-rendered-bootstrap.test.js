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

for (const scenario of ['admin', 'signed-out', 'denied', 'network', 'timeout', 'throttled']) {
  test(`admin player bootstrap exits loading: ${scenario}`, async () => {
    const elements = new Map();
    const element = () => ({ textContent: '', dataset: {}, hidden: true, value: '',
      handlers: {}, addEventListener(name,handler) { this.handlers[name]=handler; }, replaceChildren() {}, append() {}, setAttribute() {} });
    let calls = 0;
    const context = vm.createContext({
      document: { querySelector(selector) { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); }, createElement: element },
      sessionStorage: { getItem: () => scenario === 'signed-out' ? '' : 'test-token' },
      window: {}, AbortSignal: { timeout(ms) { assert.equal(ms,15000); return AbortSignal.timeout(ms); } }, location: { search: '?season=requested-season' }, URLSearchParams,
      fetch: async (url, options) => {
        calls++;
        assert.equal(url, '/api/admin/players');
        assert.equal(options.headers.authorization, 'Bearer test-token');
        if (scenario === 'network') throw new Error('Network unavailable');
        assert.ok(options.signal);
        if (scenario === 'timeout') throw Object.assign(new Error('timeout'),{name:'TimeoutError'});
        if (scenario === 'throttled') return {ok:false,status:429,headers:{get:()=> '10'},text:async()=>JSON.stringify({error:'Wait 10 seconds'})};
        return { ok: scenario !== 'denied', status: scenario === 'denied' ? 403 : 200,
          headers: { get: () => null }, text: async () => JSON.stringify(scenario === 'denied' ? {error: 'Admin access required'} : {players: [], rosterTeams: []}) };
      }
    });
    new vm.Script(script()).runInContext(context);
    await new Promise(resolve => setImmediate(resolve));
    const status = elements.get('[data-status]');
    assert.equal(status.textContent, {admin: '0 players loaded.', 'signed-out': 'Sign in from Profile to use league admin tools.', denied: 'Admin access required', network: 'Network unavailable', timeout:'Player loading timed out. Try again.', throttled:'Wait 10 seconds'}[scenario]);
    assert.equal(calls, scenario === 'signed-out' ? 0 : 1);
    assert.equal(elements.get('[data-retry]').hidden, scenario === 'admin' || scenario === 'throttled');
    if (scenario !== 'admin') assert.equal(elements.get('[data-list]').hidden, true);
    if (scenario === 'network' || scenario === 'timeout') {
      const retry = elements.get('[data-retry]').handlers.click;
      await Promise.all([retry(),retry()]);
      assert.equal(calls,2,'explicit retry is single-flight; no automatic request loop');
    }
  });
}

test('rendered player search separates whitespace and keeps letters s', () => {
  const context = vm.createContext({});
  const source = script();
  new vm.Script(source.match(/function normalize[^\n]+/)[0] + '\n' + source.match(/function matchesQuery[^\n]+/)[0]).runInContext(context);
  assert.equal(vm.runInContext("matchesQuery({displayName:'Susan Captain',teams:[{teamName:'Breakers'}]},'susan breakers')",context), true);
  assert.equal(vm.runInContext("matchesQuery({displayName:'Susan Captain',teams:[]},'unrelated')",context), false);
});
