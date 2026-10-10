import test from 'node:test';
import assert from 'node:assert/strict';

test('adminPlayersRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/adminPlayersRepository.js');
  const expected = ["createAdminPlayersRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminPlayersRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamEntry.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamEntry.js');
  const expected = ["INITIAL_TEAM_ROSTER_MINIMUM","deriveAdminSeasonTeamEntry"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamEntry.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  const expected = ["listAdminSeasonTeamsCommand","createPreparedAdminSeasonTeamCommand","addAdminSeasonTeamCommand","listAdminTeamCaptainCandidatesCommand","assignAdminTeamCaptainCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsHttp.js');
  const expected = ["createAdminSeasonTeamsHttpHandlers","adminSeasonTeamsHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsPage.js');
  const expected = ["renderAdminSeasonTeamsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsRepository.js');
  const expected = ["createAdminSeasonTeamsRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsRouter.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsRouter.js');
  const expected = ["routeAdminSeasonTeams"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsRouter.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonsPage.js');
  const expected = ["renderAdminSeasonsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSurfaceTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSurfaceTheme.js');
  const expected = ["adminSurfaceThemeStyles","injectAdminSurfaceTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSurfaceTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('appShell.js loads and exports its named members', async () => {
  const mod = await import('../src/appShell.js');
  const expected = ["friendlyErrorMessage","renderPrimaryNavigation","shellStyles","decorateHtmlWithShell","isKnownAppPagePath","renderNotFoundPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'appShell.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
