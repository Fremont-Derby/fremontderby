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
test('jflSeasonScheduleHttp.js exports routeJflSeasonSchedule as a defined value', async () => {
  const mod = await import('../src/jflSeasonScheduleHttp.js');
  assert.notEqual(mod.routeJflSeasonSchedule, undefined, 'routeJflSeasonSchedule is missing');
});
test('jflSimulatedGoogleAuth.js loads and exports its named members', async () => {
  const mod = await import('../src/jflSimulatedGoogleAuth.js');
  const expected = ["injectJflSimulatedGoogleAuth"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflSimulatedGoogleAuth.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflSimulatedGoogleAuth.js exports injectJflSimulatedGoogleAuth as a defined value', async () => {
  const mod = await import('../src/jflSimulatedGoogleAuth.js');
  assert.notEqual(mod.injectJflSimulatedGoogleAuth, undefined, 'injectJflSimulatedGoogleAuth is missing');
});
test('lineupCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupCommands.js');
  const expected = ["submitTeamLineupCommand","listVisibleTeamLineupsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupCommands.js exports submitTeamLineupCommand as a defined value', async () => {
  const mod = await import('../src/lineupCommands.js');
  assert.notEqual(mod.submitTeamLineupCommand, undefined, 'submitTeamLineupCommand is missing');
});
test('lineupCommands.js exports listVisibleTeamLineupsCommand as a defined value', async () => {
  const mod = await import('../src/lineupCommands.js');
  assert.notEqual(mod.listVisibleTeamLineupsCommand, undefined, 'listVisibleTeamLineupsCommand is missing');
});
test('lineupPage.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupPage.js');
  const expected = ["renderLineupPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupPage.js exports renderLineupPage as a defined value', async () => {
  const mod = await import('../src/lineupPage.js');
  assert.notEqual(mod.renderLineupPage, undefined, 'renderLineupPage is missing');
});
test('lineupRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupRepository.js');
  const expected = ["createLineupRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupRepository.js exports createLineupRepository as a defined value', async () => {
  const mod = await import('../src/lineupRepository.js');
  assert.notEqual(mod.createLineupRepository, undefined, 'createLineupRepository is missing');
});
test('lineupTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/lineupTheme.js');
  const expected = ["lineupThemeStyles","injectLineupTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'lineupTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('lineupTheme.js exports lineupThemeStyles as a defined value', async () => {
  const mod = await import('../src/lineupTheme.js');
  assert.notEqual(mod.lineupThemeStyles, undefined, 'lineupThemeStyles is missing');
});
test('lineupTheme.js exports injectLineupTheme as a defined value', async () => {
  const mod = await import('../src/lineupTheme.js');
  assert.notEqual(mod.injectLineupTheme, undefined, 'injectLineupTheme is missing');
});
test('liveRackLedgerAdapter.js loads and exports its named members', async () => {
  const mod = await import('../src/liveRackLedgerAdapter.js');
  const expected = ["liveRackLedgerAdapterSource"];
  for (const name of expected) {
    assert.ok(name in mod, 'liveRackLedgerAdapter.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('liveRackLedgerAdapter.js exports liveRackLedgerAdapterSource as a defined value', async () => {
  const mod = await import('../src/liveRackLedgerAdapter.js');
  assert.notEqual(mod.liveRackLedgerAdapterSource, undefined, 'liveRackLedgerAdapterSource is missing');
});
test('messagesTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/messagesTheme.js');
  const expected = ["messagesThemeStyles","messagesSimplifierScript","injectMessagesTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'messagesTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('messagesTheme.js exports messagesThemeStyles as a defined value', async () => {
  const mod = await import('../src/messagesTheme.js');
  assert.notEqual(mod.messagesThemeStyles, undefined, 'messagesThemeStyles is missing');
});
test('messagesTheme.js exports messagesSimplifierScript as a defined value', async () => {
  const mod = await import('../src/messagesTheme.js');
  assert.notEqual(mod.messagesSimplifierScript, undefined, 'messagesSimplifierScript is missing');
});
test('messagesTheme.js exports injectMessagesTheme as a defined value', async () => {
  const mod = await import('../src/messagesTheme.js');
  assert.notEqual(mod.injectMessagesTheme, undefined, 'injectMessagesTheme is missing');
});
test('mobileMenuAccessibility.js loads and exports its named members', async () => {
  const mod = await import('../src/mobileMenuAccessibility.js');
  const expected = ["injectMobileMenuAccessibility"];
  for (const name of expected) {
    assert.ok(name in mod, 'mobileMenuAccessibility.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('mobileMenuAccessibility.js exports injectMobileMenuAccessibility as a defined value', async () => {
  const mod = await import('../src/mobileMenuAccessibility.js');
  assert.notEqual(mod.injectMobileMenuAccessibility, undefined, 'injectMobileMenuAccessibility is missing');
});
test('modernUiCatalog.js loads and exports its named members', async () => {
  const mod = await import('../src/modernUiCatalog.js');
  const expected = ["renderModernUiCatalog","routeModernUiCatalog"];
  for (const name of expected) {
    assert.ok(name in mod, 'modernUiCatalog.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('modernUiCatalog.js exports renderModernUiCatalog as a defined value', async () => {
  const mod = await import('../src/modernUiCatalog.js');
  assert.notEqual(mod.renderModernUiCatalog, undefined, 'renderModernUiCatalog is missing');
});
test('modernUiCatalog.js exports routeModernUiCatalog as a defined value', async () => {
  const mod = await import('../src/modernUiCatalog.js');
  assert.notEqual(mod.routeModernUiCatalog, undefined, 'routeModernUiCatalog is missing');
});
