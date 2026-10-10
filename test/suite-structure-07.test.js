import test from 'node:test';
import assert from 'node:assert/strict';

test('jflNotificationsHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/jflNotificationsHttp.js');
  const expected = ["createJflNotificationsRoute","routeJflNotifications"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflNotificationsHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflNotificationsHttp.js exports createJflNotificationsRoute as a defined value', async () => {
  const mod = await import('../src/jflNotificationsHttp.js');
  assert.notEqual(mod.createJflNotificationsRoute, undefined, 'createJflNotificationsRoute is missing');
});
test('jflNotificationsHttp.js exports routeJflNotifications as a defined value', async () => {
  const mod = await import('../src/jflNotificationsHttp.js');
  assert.notEqual(mod.routeJflNotifications, undefined, 'routeJflNotifications is missing');
});
test('jflNotificationsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflNotificationsPage.js');
  const expected = ["renderJflNotificationsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflNotificationsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflNotificationsPage.js exports renderJflNotificationsPage as a defined value', async () => {
  const mod = await import('../src/jflNotificationsPage.js');
  assert.notEqual(mod.renderJflNotificationsPage, undefined, 'renderJflNotificationsPage is missing');
});
test('jflPlayersDirectory.js loads and exports its named members', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  const expected = ["publicDirectoryRows","renderJflPlayersDirectory","routeJflPlayersDirectory"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflPlayersDirectory.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflPlayersDirectory.js exports publicDirectoryRows as a defined value', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  assert.notEqual(mod.publicDirectoryRows, undefined, 'publicDirectoryRows is missing');
});
test('jflPlayersDirectory.js exports renderJflPlayersDirectory as a defined value', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  assert.notEqual(mod.renderJflPlayersDirectory, undefined, 'renderJflPlayersDirectory is missing');
});
test('jflPlayersDirectory.js exports routeJflPlayersDirectory as a defined value', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  assert.notEqual(mod.routeJflPlayersDirectory, undefined, 'routeJflPlayersDirectory is missing');
});
test('jflProvisionalSeedHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/jflProvisionalSeedHttp.js');
  const expected = ["routeJflProvisionalSeed","enhanceJflProvisionalSeedLink"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflProvisionalSeedHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflProvisionalSeedHttp.js exports routeJflProvisionalSeed as a defined value', async () => {
  const mod = await import('../src/jflProvisionalSeedHttp.js');
  assert.notEqual(mod.routeJflProvisionalSeed, undefined, 'routeJflProvisionalSeed is missing');
});
test('jflProvisionalSeedHttp.js exports enhanceJflProvisionalSeedLink as a defined value', async () => {
  const mod = await import('../src/jflProvisionalSeedHttp.js');
  assert.notEqual(mod.enhanceJflProvisionalSeedLink, undefined, 'enhanceJflProvisionalSeedLink is missing');
});
test('jflProvisionalSeedPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflProvisionalSeedPage.js');
  const expected = ["renderJflProvisionalSeedPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflProvisionalSeedPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflProvisionalSeedPage.js exports renderJflProvisionalSeedPage as a defined value', async () => {
  const mod = await import('../src/jflProvisionalSeedPage.js');
  assert.notEqual(mod.renderJflProvisionalSeedPage, undefined, 'renderJflProvisionalSeedPage is missing');
});
test('jflPublicPlayoffs.js loads and exports its named members', async () => {
  const mod = await import('../src/jflPublicPlayoffs.js');
  const expected = ["publicPlayoffRounds","renderJflPublicPlayoffs","routeJflPublicPlayoffs"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflPublicPlayoffs.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflPublicPlayoffs.js exports publicPlayoffRounds as a defined value', async () => {
  const mod = await import('../src/jflPublicPlayoffs.js');
  assert.notEqual(mod.publicPlayoffRounds, undefined, 'publicPlayoffRounds is missing');
});
test('jflPublicPlayoffs.js exports renderJflPublicPlayoffs as a defined value', async () => {
  const mod = await import('../src/jflPublicPlayoffs.js');
  assert.notEqual(mod.renderJflPublicPlayoffs, undefined, 'renderJflPublicPlayoffs is missing');
});
test('jflPublicPlayoffs.js exports routeJflPublicPlayoffs as a defined value', async () => {
  const mod = await import('../src/jflPublicPlayoffs.js');
  assert.notEqual(mod.routeJflPublicPlayoffs, undefined, 'routeJflPublicPlayoffs is missing');
});
test('jflQaMatchResult.js loads and exports its named members', async () => {
  const mod = await import('../src/jflQaMatchResult.js');
  const expected = ["summarizeQaRegularMatch"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflQaMatchResult.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflQaMatchResult.js exports summarizeQaRegularMatch as a defined value', async () => {
  const mod = await import('../src/jflQaMatchResult.js');
  assert.notEqual(mod.summarizeQaRegularMatch, undefined, 'summarizeQaRegularMatch is missing');
});
test('jflQaResultsEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/jflQaResultsEnhancer.js');
  const expected = ["enhanceJflQaResults"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflQaResultsEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflQaResultsEnhancer.js exports enhanceJflQaResults as a defined value', async () => {
  const mod = await import('../src/jflQaResultsEnhancer.js');
  assert.notEqual(mod.enhanceJflQaResults, undefined, 'enhanceJflQaResults is missing');
});
test('jflQaResultsHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/jflQaResultsHttp.js');
  const expected = ["QA_SEASON","createJflQaResultsRoute","routeJflQaResults"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflQaResultsHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflQaResultsHttp.js exports QA_SEASON as a defined value', async () => {
  const mod = await import('../src/jflQaResultsHttp.js');
  assert.notEqual(mod.QA_SEASON, undefined, 'QA_SEASON is missing');
});
test('jflQaResultsHttp.js exports createJflQaResultsRoute as a defined value', async () => {
  const mod = await import('../src/jflQaResultsHttp.js');
  assert.notEqual(mod.createJflQaResultsRoute, undefined, 'createJflQaResultsRoute is missing');
});
test('jflQaResultsHttp.js exports routeJflQaResults as a defined value', async () => {
  const mod = await import('../src/jflQaResultsHttp.js');
  assert.notEqual(mod.routeJflQaResults, undefined, 'routeJflQaResults is missing');
});
test('jflScheduleRaceClient.js loads and exports its named members', async () => {
  const mod = await import('../src/jflScheduleRaceClient.js');
  const expected = ["jflScheduleRaceStyles","jflScheduleRaceClientScript"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflScheduleRaceClient.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflScheduleRaceClient.js exports jflScheduleRaceStyles as a defined value', async () => {
  const mod = await import('../src/jflScheduleRaceClient.js');
  assert.notEqual(mod.jflScheduleRaceStyles, undefined, 'jflScheduleRaceStyles is missing');
});
test('jflScheduleRaceClient.js exports jflScheduleRaceClientScript as a defined value', async () => {
  const mod = await import('../src/jflScheduleRaceClient.js');
  assert.notEqual(mod.jflScheduleRaceClientScript, undefined, 'jflScheduleRaceClientScript is missing');
});
