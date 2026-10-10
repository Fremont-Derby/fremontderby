import test from 'node:test';
import assert from 'node:assert/strict';

test('jflSeasonScheduleHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/jflSeasonScheduleHttp.js');
  const expected = ["routeJflSeasonSchedule"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflSeasonScheduleHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflSimulatedGoogleAuth.js loads and exports its named members', async () => {
  const mod = await import('../src/jflSimulatedGoogleAuth.js');
  const expected = ["injectJflSimulatedGoogleAuth"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflSimulatedGoogleAuth.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupCommands.js');
  const expected = ["submitTeamLineupCommand","listVisibleTeamLineupsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupPage.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupPage.js');
  const expected = ["renderLineupPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupRepository.js');
  const expected = ["createLineupRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupTheme.js');
  const expected = ["lineupThemeStyles","injectLineupTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('liveRackLedgerAdapter.js loads and exports its named members', async () => {
  const mod = await import('../src/liveRackLedgerAdapter.js');
  const expected = ["liveRackLedgerAdapterSource"];
  for (const name of expected) {
    assert.ok(name in mod, 'liveRackLedgerAdapter.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('messagesTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/messagesTheme.js');
  const expected = ["messagesThemeStyles","messagesSimplifierScript","injectMessagesTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'messagesTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('mobileMenuAccessibility.js loads and exports its named members', async () => {
  const mod = await import('../src/mobileMenuAccessibility.js');
  const expected = ["injectMobileMenuAccessibility"];
  for (const name of expected) {
    assert.ok(name in mod, 'mobileMenuAccessibility.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('modernUiCatalog.js loads and exports its named members', async () => {
  const mod = await import('../src/modernUiCatalog.js');
  const expected = ["renderModernUiCatalog","routeModernUiCatalog"];
  for (const name of expected) {
    assert.ok(name in mod, 'modernUiCatalog.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
