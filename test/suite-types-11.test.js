import test from 'node:test';
import assert from 'node:assert/strict';

test('modernUiSlice.js MODERN_UI_PROOF_PATH has a usable type', async () => {
  const mod = await import('../src/modernUiSlice.js');
  const value = mod.MODERN_UI_PROOF_PATH;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('modernUiSlice.js getModernUiMode has a usable type', async () => {
  const mod = await import('../src/modernUiSlice.js');
  const value = mod.getModernUiMode;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('modernUiSlice.js decorateModernUiSliceResponse has a usable type', async () => {
  const mod = await import('../src/modernUiSlice.js');
  const value = mod.decorateModernUiSliceResponse;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('persistentAuthSession.js injectPersistentAuthSession has a usable type', async () => {
  const mod = await import('../src/persistentAuthSession.js');
  const value = mod.injectPersistentAuthSession;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerClaimHttp.js routePlayerClaim has a usable type', async () => {
  const mod = await import('../src/playerClaimHttp.js');
  const value = mod.routePlayerClaim;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerClaimRepository.js createPlayerClaimRepository has a usable type', async () => {
  const mod = await import('../src/playerClaimRepository.js');
  const value = mod.createPlayerClaimRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerContactCommands.js getOwnPlayerContactCommand has a usable type', async () => {
  const mod = await import('../src/playerContactCommands.js');
  const value = mod.getOwnPlayerContactCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerContactCommands.js setOwnPlayerContactCommand has a usable type', async () => {
  const mod = await import('../src/playerContactCommands.js');
  const value = mod.setOwnPlayerContactCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerContactCommands.js getAdminPlayerContactCommand has a usable type', async () => {
  const mod = await import('../src/playerContactCommands.js');
  const value = mod.getAdminPlayerContactCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerContactHttp.js routePlayerContact has a usable type', async () => {
  const mod = await import('../src/playerContactHttp.js');
  const value = mod.routePlayerContact;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerContactRepository.js createPlayerContactRepository has a usable type', async () => {
  const mod = await import('../src/playerContactRepository.js');
  const value = mod.createPlayerContactRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerProfileCommands.js getOwnPlayerProfileCommand has a usable type', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  const value = mod.getOwnPlayerProfileCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('playerProfileCommands.js saveOwnPlayerProfileCommand has a usable type', async () => {
  const mod = await import('../src/playerProfileCommands.js');
  const value = mod.saveOwnPlayerProfileCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
