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
test('playerSeasonRegistrationHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playerSeasonRegistrationHttp.js');
  const expected = ["routePlayerSeasonRegistration"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerSeasonRegistrationHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playerSurfaceTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/playerSurfaceTheme.js');
  const expected = ["playerSurfaceThemeStyles","injectPlayerSurfaceTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'playerSurfaceTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playoffCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/playoffCommands.js');
  const expected = ["startSeasonPlayoffsCommand","advanceSeasonToChampionshipCommand","submitPostseasonLineupCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'playoffCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playoffHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/playoffHttp.js');
  const expected = ["createPlayoffHttpHandlers","playoffHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'playoffHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('playoffRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/playoffRepository.js');
  const expected = ["createPlayoffRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'playoffRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('prizeCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/prizeCommands.js');
  const expected = ["getSeasonPrizeSummaryCommand","configureSeasonPrizesCommand","finalizeSeasonPrizePayoutsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'prizeCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('prizeRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/prizeRepository.js');
  const expected = ["createPrizeRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'prizeRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('prizesPage.js loads and exports its named members', async () => {
  const mod = await import('../src/prizesPage.js');
  const expected = ["renderPrizesPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'prizesPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('profileContactEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/profileContactEnhancer.js');
  const expected = ["enhanceProfileContact"];
  for (const name of expected) {
    assert.ok(name in mod, 'profileContactEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
