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
test('modernUiPrimitives.js exports modernUiPrimitiveStyles as a defined value', async () => {
  const mod = await import('../src/modernUiPrimitives.js');
  assert.notEqual(mod.modernUiPrimitiveStyles, undefined, 'modernUiPrimitiveStyles is missing');
});
test('modernUiSlice.js loads and exports its named members', async () => {
  const mod = await import('../src/modernUiSlice.js');
  const expected = ["MODERN_UI_PROOF_PATH","getModernUiMode","decorateModernUiSliceResponse"];
  for (const name of expected) {
    assert.ok(name in mod, 'modernUiSlice.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('modernUiSlice.js exports MODERN_UI_PROOF_PATH as a defined value', async () => {
  const mod = await import('../src/modernUiSlice.js');
  assert.notEqual(mod.MODERN_UI_PROOF_PATH, undefined, 'MODERN_UI_PROOF_PATH is missing');
});
test('modernUiSlice.js exports getModernUiMode as a defined value', async () => {
  const mod = await import('../src/modernUiSlice.js');
  assert.notEqual(mod.getModernUiMode, undefined, 'getModernUiMode is missing');
});
test('modernUiSlice.js exports decorateModernUiSliceResponse as a defined value', async () => {
  const mod = await import('../src/modernUiSlice.js');
  assert.notEqual(mod.decorateModernUiSliceResponse, undefined, 'decorateModernUiSliceResponse is missing');
});
test('persistentAuthSession.js loads and exports its named members', async () => {
  const mod = await import('../src/persistentAuthSession.js');
  const expected = ["injectPersistentAuthSession"];
  for (const name of expected) {
    assert.ok(name in mod, 'persistentAuthSession.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('persistentAuthSession.js exports injectPersistentAuthSession as a defined value', async () => {
  const mod = await import('../src/persistentAuthSession.js');
  assert.notEqual(mod.injectPersistentAuthSession, undefined, 'injectPersistentAuthSession is missing');
});
test('playerClaimHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playerClaimHttp.js');
  const expected = ["routePlayerClaim"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerClaimHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerClaimHttp.js exports routePlayerClaim as a defined value', async () => {
  const mod = await import('../src/playerClaimHttp.js');
  assert.notEqual(mod.routePlayerClaim, undefined, 'routePlayerClaim is missing');
});
test('playerClaimRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playerClaimRepository.js');
  const expected = ["createPlayerClaimRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerClaimRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerClaimRepository.js exports createPlayerClaimRepository as a defined value', async () => {
  const mod = await import('../src/playerClaimRepository.js');
  assert.notEqual(mod.createPlayerClaimRepository, undefined, 'createPlayerClaimRepository is missing');
});
test('playerContactCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/playerContactCommands.js');
  const expected = ["getOwnPlayerContactCommand","setOwnPlayerContactCommand","getAdminPlayerContactCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerContactCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerContactCommands.js exports getOwnPlayerContactCommand as a defined value', async () => {
  const mod = await import('../src/playerContactCommands.js');
  assert.notEqual(mod.getOwnPlayerContactCommand, undefined, 'getOwnPlayerContactCommand is missing');
});
test('playerContactCommands.js exports setOwnPlayerContactCommand as a defined value', async () => {
  const mod = await import('../src/playerContactCommands.js');
  assert.notEqual(mod.setOwnPlayerContactCommand, undefined, 'setOwnPlayerContactCommand is missing');
});
test('playerContactCommands.js exports getAdminPlayerContactCommand as a defined value', async () => {
  const mod = await import('../src/playerContactCommands.js');
  assert.notEqual(mod.getAdminPlayerContactCommand, undefined, 'getAdminPlayerContactCommand is missing');
});
test('playerContactHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playerContactHttp.js');
  const expected = ["routePlayerContact"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerContactHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerContactHttp.js exports routePlayerContact as a defined value', async () => {
  const mod = await import('../src/playerContactHttp.js');
  assert.notEqual(mod.routePlayerContact, undefined, 'routePlayerContact is missing');
});
test('playerContactRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playerContactRepository.js');
  const expected = ["createPlayerContactRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerContactRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerContactRepository.js exports createPlayerContactRepository as a defined value', async () => {
  const mod = await import('../src/playerContactRepository.js');
  assert.notEqual(mod.createPlayerContactRepository, undefined, 'createPlayerContactRepository is missing');
});
test('playerProfileCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  const expected = ["getOwnPlayerProfileCommand","saveOwnPlayerProfileCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerProfileCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerProfileCommands.js exports getOwnPlayerProfileCommand as a defined value', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  assert.notEqual(mod.getOwnPlayerProfileCommand, undefined, 'getOwnPlayerProfileCommand is missing');
});
test('playerProfileCommands.js exports saveOwnPlayerProfileCommand as a defined value', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  assert.notEqual(mod.saveOwnPlayerProfileCommand, undefined, 'saveOwnPlayerProfileCommand is missing');
});
test('playerProfileRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playerProfileRepository.js');
  const expected = ["createPlayerProfileRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerProfileRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerProfileRepository.js exports createPlayerProfileRepository as a defined value', async () => {
  const mod = await import('../src/playerProfileRepository.js');
  assert.notEqual(mod.createPlayerProfileRepository, undefined, 'createPlayerProfileRepository is missing');
});
