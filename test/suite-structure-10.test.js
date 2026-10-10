import test from 'node:test';
import assert from 'node:assert/strict';

test('playerSandboxPage.js loads and exports its named members', async () => {
  const mod = await import('../src/playerSandboxPage.js');
  const expected = ["renderPlayerSandboxPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerSandboxPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerSandboxPage.js exports renderPlayerSandboxPage as a defined value', async () => {
  const mod = await import('../src/playerSandboxPage.js');
  assert.notEqual(mod.renderPlayerSandboxPage, undefined, 'renderPlayerSandboxPage is missing');
});
test('playerSeasonRegistrationHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playerSeasonRegistrationHttp.js');
  const expected = ["routePlayerSeasonRegistration"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerSeasonRegistrationHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerSeasonRegistrationHttp.js exports routePlayerSeasonRegistration as a defined value', async () => {
  const mod = await import('../src/playerSeasonRegistrationHttp.js');
  assert.notEqual(mod.routePlayerSeasonRegistration, undefined, 'routePlayerSeasonRegistration is missing');
});
test('playerSurfaceTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/playerSurfaceTheme.js');
  const expected = ["playerSurfaceThemeStyles","injectPlayerSurfaceTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerSurfaceTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerSurfaceTheme.js exports playerSurfaceThemeStyles as a defined value', async () => {
  const mod = await import('../src/playerSurfaceTheme.js');
  assert.notEqual(mod.playerSurfaceThemeStyles, undefined, 'playerSurfaceThemeStyles is missing');
});
test('playerSurfaceTheme.js exports injectPlayerSurfaceTheme as a defined value', async () => {
  const mod = await import('../src/playerSurfaceTheme.js');
  assert.notEqual(mod.injectPlayerSurfaceTheme, undefined, 'injectPlayerSurfaceTheme is missing');
});
test('playoffCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/playoffCommands.js');
  const expected = ["startSeasonPlayoffsCommand","advanceSeasonToChampionshipCommand","submitPostseasonLineupCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'playoffCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playoffCommands.js exports startSeasonPlayoffsCommand as a defined value', async () => {
  const mod = await import('../src/playoffCommands.js');
  assert.notEqual(mod.startSeasonPlayoffsCommand, undefined, 'startSeasonPlayoffsCommand is missing');
});
test('playoffCommands.js exports advanceSeasonToChampionshipCommand as a defined value', async () => {
  const mod = await import('../src/playoffCommands.js');
  assert.notEqual(mod.advanceSeasonToChampionshipCommand, undefined, 'advanceSeasonToChampionshipCommand is missing');
});
test('playoffCommands.js exports submitPostseasonLineupCommand as a defined value', async () => {
  const mod = await import('../src/playoffCommands.js');
  assert.notEqual(mod.submitPostseasonLineupCommand, undefined, 'submitPostseasonLineupCommand is missing');
});
test('playoffHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playoffHttp.js');
  const expected = ["createPlayoffHttpHandlers","playoffHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'playoffHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playoffHttp.js exports createPlayoffHttpHandlers as a defined value', async () => {
  const mod = await import('../src/playoffHttp.js');
  assert.notEqual(mod.createPlayoffHttpHandlers, undefined, 'createPlayoffHttpHandlers is missing');
});
test('playoffHttp.js exports playoffHttpHandlers as a defined value', async () => {
  const mod = await import('../src/playoffHttp.js');
  assert.notEqual(mod.playoffHttpHandlers, undefined, 'playoffHttpHandlers is missing');
});
test('playoffRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playoffRepository.js');
  const expected = ["createPlayoffRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playoffRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playoffRepository.js exports createPlayoffRepository as a defined value', async () => {
  const mod = await import('../src/playoffRepository.js');
  assert.notEqual(mod.createPlayoffRepository, undefined, 'createPlayoffRepository is missing');
});
test('prizeCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/prizeCommands.js');
  const expected = ["getSeasonPrizeSummaryCommand","configureSeasonPrizesCommand","finalizeSeasonPrizePayoutsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'prizeCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('prizeCommands.js exports getSeasonPrizeSummaryCommand as a defined value', async () => {
  const mod = await import('../src/prizeCommands.js');
  assert.notEqual(mod.getSeasonPrizeSummaryCommand, undefined, 'getSeasonPrizeSummaryCommand is missing');
});
test('prizeCommands.js exports configureSeasonPrizesCommand as a defined value', async () => {
  const mod = await import('../src/prizeCommands.js');
  assert.notEqual(mod.configureSeasonPrizesCommand, undefined, 'configureSeasonPrizesCommand is missing');
});
test('prizeCommands.js exports finalizeSeasonPrizePayoutsCommand as a defined value', async () => {
  const mod = await import('../src/prizeCommands.js');
  assert.notEqual(mod.finalizeSeasonPrizePayoutsCommand, undefined, 'finalizeSeasonPrizePayoutsCommand is missing');
});
test('prizeRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/prizeRepository.js');
  const expected = ["createPrizeRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'prizeRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('prizeRepository.js exports createPrizeRepository as a defined value', async () => {
  const mod = await import('../src/prizeRepository.js');
  assert.notEqual(mod.createPrizeRepository, undefined, 'createPrizeRepository is missing');
});
test('prizesPage.js loads and exports its named members', async () => {
  const mod = await import('../src/prizesPage.js');
  const expected = ["renderPrizesPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'prizesPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('prizesPage.js exports renderPrizesPage as a defined value', async () => {
  const mod = await import('../src/prizesPage.js');
  assert.notEqual(mod.renderPrizesPage, undefined, 'renderPrizesPage is missing');
});
test('profileContactEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profileContactEnhancer.js');
  const expected = ["enhanceProfileContact"];
  for (const name of expected) {
    assert.ok(name in mod, 'profileContactEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profileContactEnhancer.js exports enhanceProfileContact as a defined value', async () => {
  const mod = await import('../src/profileContactEnhancer.js');
  assert.notEqual(mod.enhanceProfileContact, undefined, 'enhanceProfileContact is missing');
});
