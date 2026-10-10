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
test('teamMembershipRequestHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMembershipRequestHttp.js');
  const expected = ["createTeamMembershipRequestHttpHandlers","teamMembershipRequestHttpHandlers"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMembershipRequestHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamMembershipRequestRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/teamMembershipRequestRepository.js');
  const expected = ["createTeamMembershipRequestRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamMembershipRequestRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamRegistrationCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const expected = ["getOwnTeamRegistrationCommand","submitTeamApplicationCommand","withdrawTeamApplicationCommand","respondToReturningTeamSlotCommand","getAdminSeasonRegistrationCommand","configureSeasonRegistrationCommand","reviewTeamApplicationCommand","manageTeamSlotCommand","seedReturningTeamSlotsCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamRegistrationCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamRegistrationRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/teamRegistrationRepository.js');
  const expected = ["createTeamRegistrationRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamRegistrationRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/teamRepository.js');
  const expected = ["createTeamRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamsCanonicalActionsEnhancer.js loads and exports its named members', async () => {
  const mod = await import('../src/teamsCanonicalActionsEnhancer.js');
  const expected = ["enhanceTeamsCanonicalActions"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamsCanonicalActionsEnhancer.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamsPage.js loads and exports its named members', async () => {
  const mod = await import('../src/teamsPage.js');
  const expected = ["renderTeamsPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamsPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('teamsTheme.js loads and exports its named members', async () => {
  const mod = await import('../src/teamsTheme.js');
  const expected = ["teamsThemeStyles","injectTeamsTheme"];
  for (const name of expected) {
    assert.ok(name in mod, 'teamsTheme.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('testPersona.js loads and exports its named members', async () => {
  const mod = await import('../src/testPersona.js');
  const expected = ["TEST_PERSONAS","TEST_PERSONA_COOKIE","testPersonaEnabled","listTestPersonas","findTestPersona","isTestPersonaOperator","selectedTestPersonaKey","resolveTestPersonaActor","testPersonaCookieHeader","clearTestPersonaCookieHeader","personaActorId"];
  for (const name of expected) {
    assert.ok(name in mod, 'testPersona.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
