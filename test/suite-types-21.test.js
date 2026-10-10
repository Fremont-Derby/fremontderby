import test from 'node:test';
import assert from 'node:assert/strict';

test('teamMembershipRequestHttp.js createTeamMembershipRequestHttpHandlers has a usable type', async () => {
  const mod = await import('../src/teamMembershipRequestHttp.js');
  const value = mod.createTeamMembershipRequestHttpHandlers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamMembershipRequestHttp.js teamMembershipRequestHttpHandlers has a usable type', async () => {
  const mod = await import('../src/teamMembershipRequestHttp.js');
  const value = mod.teamMembershipRequestHttpHandlers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamMembershipRequestRepository.js createTeamMembershipRequestRepository has a usable type', async () => {
  const mod = await import('../src/teamMembershipRequestRepository.js');
  const value = mod.createTeamMembershipRequestRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js getOwnTeamRegistrationCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.getOwnTeamRegistrationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js submitTeamApplicationCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.submitTeamApplicationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js withdrawTeamApplicationCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.withdrawTeamApplicationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js respondToReturningTeamSlotCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.respondToReturningTeamSlotCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js getAdminSeasonRegistrationCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.getAdminSeasonRegistrationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js configureSeasonRegistrationCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.configureSeasonRegistrationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js reviewTeamApplicationCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.reviewTeamApplicationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js manageTeamSlotCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.manageTeamSlotCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationCommands.js seedReturningTeamSlotsCommand has a usable type', async () => {
  const mod = await import('../src/teamRegistrationCommands.js');
  const value = mod.seedReturningTeamSlotsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRegistrationRepository.js createTeamRegistrationRepository has a usable type', async () => {
  const mod = await import('../src/teamRegistrationRepository.js');
  const value = mod.createTeamRegistrationRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamRepository.js createTeamRepository has a usable type', async () => {
  const mod = await import('../src/teamRepository.js');
  const value = mod.createTeamRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamsCanonicalActionsEnhancer.js enhanceTeamsCanonicalActions has a usable type', async () => {
  const mod = await import('../src/teamsCanonicalActionsEnhancer.js');
  const value = mod.enhanceTeamsCanonicalActions;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamsPage.js renderTeamsPage has a usable type', async () => {
  const mod = await import('../src/teamsPage.js');
  const value = mod.renderTeamsPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamsTheme.js teamsThemeStyles has a usable type', async () => {
  const mod = await import('../src/teamsTheme.js');
  const value = mod.teamsThemeStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('teamsTheme.js injectTeamsTheme has a usable type', async () => {
  const mod = await import('../src/teamsTheme.js');
  const value = mod.injectTeamsTheme;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
