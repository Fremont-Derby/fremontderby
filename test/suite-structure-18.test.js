import test from 'node:test';
import assert from 'node:assert/strict';

test('testPersonaEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/testPersonaEnhancer.js');
  const expected = ["injectTestPersonaControls"];
  for (const name of expected) {
    assert.ok(name in mod, 'testPersonaEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('testPersonaHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/testPersonaHttp.js');
  const expected = ["routeTestPersona"];
  for (const name of expected) {
    assert.ok(name in mod, 'testPersonaHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('tradesPage.js loads and exports its named members', async () => {
  const mod = await import('../src/tradesPage.js');
  const expected = ["renderTradesPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'tradesPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
