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
test('adminPlayersRepository.js exports createAdminPlayersRepository as a defined value', async () => {
  const mod = await import('../src/adminPlayersRepository.js');
  assert.notEqual(mod.createAdminPlayersRepository, undefined, 'createAdminPlayersRepository is missing');
});
test('adminSeasonTeamEntry.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamEntry.js');
  const expected = ["INITIAL_TEAM_ROSTER_MINIMUM","deriveAdminSeasonTeamEntry"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamEntry.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamEntry.js exports INITIAL_TEAM_ROSTER_MINIMUM as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamEntry.js');
  assert.notEqual(mod.INITIAL_TEAM_ROSTER_MINIMUM, undefined, 'INITIAL_TEAM_ROSTER_MINIMUM is missing');
});
test('adminSeasonTeamEntry.js exports deriveAdminSeasonTeamEntry as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamEntry.js');
  assert.notEqual(mod.deriveAdminSeasonTeamEntry, undefined, 'deriveAdminSeasonTeamEntry is missing');
});
test('adminSeasonTeamsCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  const expected = ["listAdminSeasonTeamsCommand","createPreparedAdminSeasonTeamCommand","addAdminSeasonTeamCommand","listAdminTeamCaptainCandidatesCommand","assignAdminTeamCaptainCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsCommands.js exports listAdminSeasonTeamsCommand as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.notEqual(mod.listAdminSeasonTeamsCommand, undefined, 'listAdminSeasonTeamsCommand is missing');
});
test('adminSeasonTeamsCommands.js exports createPreparedAdminSeasonTeamCommand as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.notEqual(mod.createPreparedAdminSeasonTeamCommand, undefined, 'createPreparedAdminSeasonTeamCommand is missing');
});
test('adminSeasonTeamsCommands.js exports addAdminSeasonTeamCommand as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.notEqual(mod.addAdminSeasonTeamCommand, undefined, 'addAdminSeasonTeamCommand is missing');
});
test('adminSeasonTeamsCommands.js exports listAdminTeamCaptainCandidatesCommand as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.notEqual(mod.listAdminTeamCaptainCandidatesCommand, undefined, 'listAdminTeamCaptainCandidatesCommand is missing');
});
test('adminSeasonTeamsCommands.js exports assignAdminTeamCaptainCommand as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.notEqual(mod.assignAdminTeamCaptainCommand, undefined, 'assignAdminTeamCaptainCommand is missing');
});
test('adminSeasonTeamsHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsHttp.js');
  const expected = ["createAdminSeasonTeamsHttpHandlers","adminSeasonTeamsHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsHttp.js exports createAdminSeasonTeamsHttpHandlers as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsHttp.js');
  assert.notEqual(mod.createAdminSeasonTeamsHttpHandlers, undefined, 'createAdminSeasonTeamsHttpHandlers is missing');
});
test('adminSeasonTeamsHttp.js exports adminSeasonTeamsHttpHandlers as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsHttp.js');
  assert.notEqual(mod.adminSeasonTeamsHttpHandlers, undefined, 'adminSeasonTeamsHttpHandlers is missing');
});
test('adminSeasonTeamsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsPage.js');
  const expected = ["renderAdminSeasonTeamsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsPage.js exports renderAdminSeasonTeamsPage as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsPage.js');
  assert.notEqual(mod.renderAdminSeasonTeamsPage, undefined, 'renderAdminSeasonTeamsPage is missing');
});
test('adminSeasonTeamsRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsRepository.js');
  const expected = ["createAdminSeasonTeamsRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsRepository.js exports createAdminSeasonTeamsRepository as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsRepository.js');
  assert.notEqual(mod.createAdminSeasonTeamsRepository, undefined, 'createAdminSeasonTeamsRepository is missing');
});
test('adminSeasonTeamsRouter.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonTeamsRouter.js');
  const expected = ["routeAdminSeasonTeams"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonTeamsRouter.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonTeamsRouter.js exports routeAdminSeasonTeams as a defined value', async () => {
  const mod = await import('../src/adminSeasonTeamsRouter.js');
  assert.notEqual(mod.routeAdminSeasonTeams, undefined, 'routeAdminSeasonTeams is missing');
});
test('adminSeasonsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSeasonsPage.js');
  const expected = ["renderAdminSeasonsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSeasonsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSeasonsPage.js exports renderAdminSeasonsPage as a defined value', async () => {
  const mod = await import('../src/adminSeasonsPage.js');
  assert.notEqual(mod.renderAdminSeasonsPage, undefined, 'renderAdminSeasonsPage is missing');
});
test('adminSurfaceTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/adminSurfaceTheme.js');
  const expected = ["adminSurfaceThemeStyles","injectAdminSurfaceTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'adminSurfaceTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('adminSurfaceTheme.js exports adminSurfaceThemeStyles as a defined value', async () => {
  const mod = await import('../src/adminSurfaceTheme.js');
  assert.notEqual(mod.adminSurfaceThemeStyles, undefined, 'adminSurfaceThemeStyles is missing');
});
test('adminSurfaceTheme.js exports injectAdminSurfaceTheme as a defined value', async () => {
  const mod = await import('../src/adminSurfaceTheme.js');
  assert.notEqual(mod.injectAdminSurfaceTheme, undefined, 'injectAdminSurfaceTheme is missing');
});
test('appShell.js loads and exports its named members', async () => {
  const mod = await import('../src/appShell.js');
  const expected = ["friendlyErrorMessage","renderPrimaryNavigation","shellStyles","decorateHtmlWithShell","isKnownAppPagePath","renderNotFoundPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'appShell.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('appShell.js exports friendlyErrorMessage as a defined value', async () => {
  const mod = await import('../src/appShell.js');
  assert.notEqual(mod.friendlyErrorMessage, undefined, 'friendlyErrorMessage is missing');
});
test('appShell.js exports renderPrimaryNavigation as a defined value', async () => {
  const mod = await import('../src/appShell.js');
  assert.notEqual(mod.renderPrimaryNavigation, undefined, 'renderPrimaryNavigation is missing');
});
test('appShell.js exports shellStyles as a defined value', async () => {
  const mod = await import('../src/appShell.js');
  assert.notEqual(mod.shellStyles, undefined, 'shellStyles is missing');
});
test('appShell.js exports decorateHtmlWithShell as a defined value', async () => {
  const mod = await import('../src/appShell.js');
  assert.notEqual(mod.decorateHtmlWithShell, undefined, 'decorateHtmlWithShell is missing');
});
test('appShell.js exports isKnownAppPagePath as a defined value', async () => {
  const mod = await import('../src/appShell.js');
  assert.notEqual(mod.isKnownAppPagePath, undefined, 'isKnownAppPagePath is missing');
});
test('appShell.js exports renderNotFoundPage as a defined value', async () => {
  const mod = await import('../src/appShell.js');
  assert.notEqual(mod.renderNotFoundPage, undefined, 'renderNotFoundPage is missing');
});
