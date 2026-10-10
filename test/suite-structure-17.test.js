import test from 'node:test';
import assert from 'node:assert/strict';

test('teamMatchChoiceRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMatchChoiceRepository.js');
  const expected = ["createTeamMatchChoiceRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMatchChoiceRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMatchChoiceRepository.js exports createTeamMatchChoiceRepository as a defined value', async () => {
  const mod = await import('../src/teamMatchChoiceRepository.js');
  assert.notEqual(mod.createTeamMatchChoiceRepository, undefined, 'createTeamMatchChoiceRepository is missing');
});
test('teamMembershipRequestHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMembershipRequestHttp.js');
  const expected = ["createTeamMembershipRequestHttpHandlers","teamMembershipRequestHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMembershipRequestHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMembershipRequestHttp.js exports createTeamMembershipRequestHttpHandlers as a defined value', async () => {
  const mod = await import('../src/teamMembershipRequestHttp.js');
  assert.notEqual(mod.createTeamMembershipRequestHttpHandlers, undefined, 'createTeamMembershipRequestHttpHandlers is missing');
});
test('teamMembershipRequestHttp.js exports teamMembershipRequestHttpHandlers as a defined value', async () => {
  const mod = await import('../src/teamMembershipRequestHttp.js');
  assert.notEqual(mod.teamMembershipRequestHttpHandlers, undefined, 'teamMembershipRequestHttpHandlers is missing');
});
test('teamMembershipRequestRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMembershipRequestRepository.js');
  const expected = ["createTeamMembershipRequestRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMembershipRequestRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMembershipRequestRepository.js exports createTeamMembershipRequestRepository as a defined value', async () => {
  const mod = await import('../src/teamMembershipRequestRepository.js');
  assert.notEqual(mod.createTeamMembershipRequestRepository, undefined, 'createTeamMembershipRequestRepository is missing');
});
test('teamRegistrationCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const expected = ["getOwnTeamRegistrationCommand","submitTeamApplicationCommand","withdrawTeamApplicationCommand","respondToReturningTeamSlotCommand","getAdminSeasonRegistrationCommand","configureSeasonRegistrationCommand","reviewTeamApplicationCommand","manageTeamSlotCommand","seedReturningTeamSlotsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamRegistrationCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamRegistrationCommands.js exports getOwnTeamRegistrationCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.getOwnTeamRegistrationCommand, undefined, 'getOwnTeamRegistrationCommand is missing');
});
test('teamRegistrationCommands.js exports submitTeamApplicationCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.submitTeamApplicationCommand, undefined, 'submitTeamApplicationCommand is missing');
});
test('teamRegistrationCommands.js exports withdrawTeamApplicationCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.withdrawTeamApplicationCommand, undefined, 'withdrawTeamApplicationCommand is missing');
});
test('teamRegistrationCommands.js exports respondToReturningTeamSlotCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.respondToReturningTeamSlotCommand, undefined, 'respondToReturningTeamSlotCommand is missing');
});
test('teamRegistrationCommands.js exports getAdminSeasonRegistrationCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.getAdminSeasonRegistrationCommand, undefined, 'getAdminSeasonRegistrationCommand is missing');
});
test('teamRegistrationCommands.js exports configureSeasonRegistrationCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.configureSeasonRegistrationCommand, undefined, 'configureSeasonRegistrationCommand is missing');
});
test('teamRegistrationCommands.js exports reviewTeamApplicationCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.reviewTeamApplicationCommand, undefined, 'reviewTeamApplicationCommand is missing');
});
test('teamRegistrationCommands.js exports manageTeamSlotCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.manageTeamSlotCommand, undefined, 'manageTeamSlotCommand is missing');
});
test('teamRegistrationCommands.js exports seedReturningTeamSlotsCommand as a defined value', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  assert.notEqual(mod.seedReturningTeamSlotsCommand, undefined, 'seedReturningTeamSlotsCommand is missing');
});
test('teamRegistrationRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/teamRegistrationRepository.js');
  const expected = ["createTeamRegistrationRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamRegistrationRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamRegistrationRepository.js exports createTeamRegistrationRepository as a defined value', async () => {
  const mod = await import('../src/teamRegistrationRepository.js');
  assert.notEqual(mod.createTeamRegistrationRepository, undefined, 'createTeamRegistrationRepository is missing');
});
test('teamRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/teamRepository.js');
  const expected = ["createTeamRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamRepository.js exports createTeamRepository as a defined value', async () => {
  const mod = await import('../src/teamRepository.js');
  assert.notEqual(mod.createTeamRepository, undefined, 'createTeamRepository is missing');
});
test('teamsCanonicalActionsEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/teamsCanonicalActionsEnhancer.js');
  const expected = ["enhanceTeamsCanonicalActions"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamsCanonicalActionsEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamsCanonicalActionsEnhancer.js exports enhanceTeamsCanonicalActions as a defined value', async () => {
  const mod = await import('../src/teamsCanonicalActionsEnhancer.js');
  assert.notEqual(mod.enhanceTeamsCanonicalActions, undefined, 'enhanceTeamsCanonicalActions is missing');
});
test('teamsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/teamsPage.js');
  const expected = ["renderTeamsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamsPage.js exports renderTeamsPage as a defined value', async () => {
  const mod = await import('../src/teamsPage.js');
  assert.notEqual(mod.renderTeamsPage, undefined, 'renderTeamsPage is missing');
});
test('teamsTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/teamsTheme.js');
  const expected = ["teamsThemeStyles","injectTeamsTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamsTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamsTheme.js exports teamsThemeStyles as a defined value', async () => {
  const mod = await import('../src/teamsTheme.js');
  assert.notEqual(mod.teamsThemeStyles, undefined, 'teamsThemeStyles is missing');
});
test('teamsTheme.js exports injectTeamsTheme as a defined value', async () => {
  const mod = await import('../src/teamsTheme.js');
  assert.notEqual(mod.injectTeamsTheme, undefined, 'injectTeamsTheme is missing');
});
test('testPersona.js loads and exports its named members', async () => {
  const mod = await import('../src/testPersona.js');
  const expected = ["TEST_PERSONAS","TEST_PERSONA_COOKIE","testPersonaEnabled","listTestPersonas","findTestPersona","isTestPersonaOperator","selectedTestPersonaKey","resolveTestPersonaActor","testPersonaCookieHeader","clearTestPersonaCookieHeader","personaActorId"];
  for (const name of expected) {
    assert.ok(name in mod, 'testPersona.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('testPersona.js exports TEST_PERSONAS as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.TEST_PERSONAS, undefined, 'TEST_PERSONAS is missing');
});
test('testPersona.js exports TEST_PERSONA_COOKIE as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.TEST_PERSONA_COOKIE, undefined, 'TEST_PERSONA_COOKIE is missing');
});
test('testPersona.js exports testPersonaEnabled as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.testPersonaEnabled, undefined, 'testPersonaEnabled is missing');
});
test('testPersona.js exports listTestPersonas as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.listTestPersonas, undefined, 'listTestPersonas is missing');
});
test('testPersona.js exports findTestPersona as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.findTestPersona, undefined, 'findTestPersona is missing');
});
test('testPersona.js exports isTestPersonaOperator as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.isTestPersonaOperator, undefined, 'isTestPersonaOperator is missing');
});
test('testPersona.js exports selectedTestPersonaKey as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.selectedTestPersonaKey, undefined, 'selectedTestPersonaKey is missing');
});
test('testPersona.js exports resolveTestPersonaActor as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.resolveTestPersonaActor, undefined, 'resolveTestPersonaActor is missing');
});
test('testPersona.js exports testPersonaCookieHeader as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.testPersonaCookieHeader, undefined, 'testPersonaCookieHeader is missing');
});
test('testPersona.js exports clearTestPersonaCookieHeader as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.clearTestPersonaCookieHeader, undefined, 'clearTestPersonaCookieHeader is missing');
});
test('testPersona.js exports personaActorId as a defined value', async () => {
  const mod = await import('../src/testPersona.js');
  assert.notEqual(mod.personaActorId, undefined, 'personaActorId is missing');
});
