import test from 'node:test';
import assert from 'node:assert/strict';

test('adminPlayersHttp.js handleListAdminPlayersRequest has a usable type', async () => {
  const mod = await import('../src/adminPlayersHttp.js');
  const value = mod.handleListAdminPlayersRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminPlayersHttp.js handleSetAdminRoleRequest has a usable type', async () => {
  const mod = await import('../src/adminPlayersHttp.js');
  const value = mod.handleSetAdminRoleRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminPlayersHttp.js adminPlayersHttpHandlers has a usable type', async () => {
  const mod = await import('../src/adminPlayersHttp.js');
  const value = mod.adminPlayersHttpHandlers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminPlayersPage.js renderAdminPlayersPage has a usable type', async () => {
  const mod = await import('../src/adminPlayersPage.js');
  const value = mod.renderAdminPlayersPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminPlayersRepository.js createAdminPlayersRepository has a usable type', async () => {
  const mod = await import('../src/adminPlayersRepository.js');
  const value = mod.createAdminPlayersRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamEntry.js INITIAL_TEAM_ROSTER_MINIMUM has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamEntry.js');
  const value = mod.INITIAL_TEAM_ROSTER_MINIMUM;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamEntry.js deriveAdminSeasonTeamEntry has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamEntry.js');
  const value = mod.deriveAdminSeasonTeamEntry;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsCommands.js listAdminSeasonTeamsCommand has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  const value = mod.listAdminSeasonTeamsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsCommands.js createPreparedAdminSeasonTeamCommand has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  const value = mod.createPreparedAdminSeasonTeamCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsCommands.js addAdminSeasonTeamCommand has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  const value = mod.addAdminSeasonTeamCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsCommands.js listAdminTeamCaptainCandidatesCommand has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  const value = mod.listAdminTeamCaptainCandidatesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsCommands.js assignAdminTeamCaptainCommand has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  const value = mod.assignAdminTeamCaptainCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsHttp.js createAdminSeasonTeamsHttpHandlers has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsHttp.js');
  const value = mod.createAdminSeasonTeamsHttpHandlers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsHttp.js adminSeasonTeamsHttpHandlers has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsHttp.js');
  const value = mod.adminSeasonTeamsHttpHandlers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsPage.js renderAdminSeasonTeamsPage has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsPage.js');
  const value = mod.renderAdminSeasonTeamsPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('adminSeasonTeamsRepository.js createAdminSeasonTeamsRepository has a usable type', async () => {
  const mod = await import('../src/adminSeasonTeamsRepository.js');
  const value = mod.createAdminSeasonTeamsRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
