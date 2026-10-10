import test from 'node:test';
import assert from 'node:assert/strict';

test('modernUiPrimitives.js loads and exports its named members', async () => {
  const mod = await import('../src/modernUiPrimitives.js');
  const expected = ["modernUiPrimitiveStyles"];
  for (const name of expected) {
    assert.ok(name in mod, 'modernUiPrimitives.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('modernUiSlice.js loads and exports its named members', async () => {
  const mod = await import('../src/modernUiSlice.js');
  const expected = ["MODERN_UI_PROOF_PATH","getModernUiMode","decorateModernUiSliceResponse"];
  for (const name of expected) {
    assert.ok(name in mod, 'modernUiSlice.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('persistentAuthSession.js loads and exports its named members', async () => {
  const mod = await import('../src/persistentAuthSession.js');
  const expected = ["injectPersistentAuthSession"];
  for (const name of expected) {
    assert.ok(name in mod, 'persistentAuthSession.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerClaimHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playerClaimHttp.js');
  const expected = ["routePlayerClaim"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerClaimHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerClaimRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playerClaimRepository.js');
  const expected = ["createPlayerClaimRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerClaimRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerContactCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/playerContactCommands.js');
  const expected = ["getOwnPlayerContactCommand","setOwnPlayerContactCommand","getAdminPlayerContactCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerContactCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerContactHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playerContactHttp.js');
  const expected = ["routePlayerContact"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerContactHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerContactRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playerContactRepository.js');
  const expected = ["createPlayerContactRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerContactRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerProfileCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  const expected = ["getOwnPlayerProfileCommand","saveOwnPlayerProfileCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerProfileCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerProfileRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playerProfileRepository.js');
  const expected = ["createPlayerProfileRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerProfileRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
