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
test('jflNotificationsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflNotificationsPage.js');
  const expected = ["renderJflNotificationsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflNotificationsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflPlayersDirectory.js loads and exports its named members', async () => {
  const mod = await import('../src/jflPlayersDirectory.js');
  const expected = ["publicDirectoryRows","renderJflPlayersDirectory","routeJflPlayersDirectory"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflPlayersDirectory.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflProvisionalSeedHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/jflProvisionalSeedHttp.js');
  const expected = ["routeJflProvisionalSeed","enhanceJflProvisionalSeedLink"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflProvisionalSeedHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflProvisionalSeedPage.js loads and exports its named members', async () => {
  const mod = await import('../src/jflProvisionalSeedPage.js');
  const expected = ["renderJflProvisionalSeedPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflProvisionalSeedPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflPublicPlayoffs.js loads and exports its named members', async () => {
  const mod = await import('../src/jflPublicPlayoffs.js');
  const expected = ["publicPlayoffRounds","renderJflPublicPlayoffs","routeJflPublicPlayoffs"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflPublicPlayoffs.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflQaMatchResult.js loads and exports its named members', async () => {
  const mod = await import('../src/jflQaMatchResult.js');
  const expected = ["summarizeQaRegularMatch"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflQaMatchResult.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflQaResultsEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/jflQaResultsEnhancer.js');
  const expected = ["enhanceJflQaResults"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflQaResultsEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflQaResultsHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/jflQaResultsHttp.js');
  const expected = ["QA_SEASON","createJflQaResultsRoute","routeJflQaResults"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflQaResultsHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('jflScheduleRaceClient.js loads and exports its named members', async () => {
  const mod = await import('../src/jflScheduleRaceClient.js');
  const expected = ["jflScheduleRaceStyles","jflScheduleRaceClientScript"];
  for (const name of expected) {
    assert.ok(name in mod, 'jflScheduleRaceClient.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
