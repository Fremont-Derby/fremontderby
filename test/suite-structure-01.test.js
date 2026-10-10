import test from 'node:test';
import assert from 'node:assert/strict';

test('accessibilityLayer.js loads and exports its named members', async () => {
  const mod = await import('../src/accessibilityLayer.js');
  const expected = ["accessibilityStyles","accessibilityScript","injectAccessibilityLayer"];
  for (const name of expected) {
    assert.ok(name in mod, 'accessibilityLayer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminCreatePlayerHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/adminCreatePlayerHttp.js');
  const expected = ["handleCreateAdminPlayerRequest"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminCreatePlayerHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminGatewayPage.js loads and exports its named members', async () => {
  const mod = await import('../src/adminGatewayPage.js');
  const expected = ["renderAdminGatewayPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminGatewayPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminGatewayRouter.js loads and exports its named members', async () => {
  const mod = await import('../src/adminGatewayRouter.js');
  const expected = ["routeAdminGateway"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminGatewayRouter.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminGatewayTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/adminGatewayTheme.js');
  const expected = ["adminGatewayThemeStyles","injectAdminGatewayTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminGatewayTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminOperationsHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/adminOperationsHttp.js');
  const expected = ["buildAdminOperationsOverview","handleAdminOperationsRequest","adminOperationsHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminOperationsHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminOperationsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/adminOperationsPage.js');
  const expected = ["renderAdminOperationsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminOperationsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminOperationsRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/adminOperationsRepository.js');
  const expected = ["createAdminOperationsRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminOperationsRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminPlayersHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/adminPlayersHttp.js');
  const expected = ["handleListAdminPlayersRequest","handleSetAdminRoleRequest","adminPlayersHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminPlayersHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminPlayersPage.js loads and exports its named members', async () => {
  const mod = await import('../src/adminPlayersPage.js');
  const expected = ["renderAdminPlayersPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminPlayersPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
