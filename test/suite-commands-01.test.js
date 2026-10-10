import test from 'node:test';
import assert from 'node:assert/strict';

test('adminSeasonTeamsCommands.js exports listAdminSeasonTeamsCommand as a function', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.equal(typeof mod.listAdminSeasonTeamsCommand, 'function');
});
test('adminSeasonTeamsCommands.js exports createPreparedAdminSeasonTeamCommand as a function', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.equal(typeof mod.createPreparedAdminSeasonTeamCommand, 'function');
});
test('adminSeasonTeamsCommands.js exports addAdminSeasonTeamCommand as a function', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.equal(typeof mod.addAdminSeasonTeamCommand, 'function');
});
test('adminSeasonTeamsCommands.js exports listAdminTeamCaptainCandidatesCommand as a function', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.equal(typeof mod.listAdminTeamCaptainCandidatesCommand, 'function');
});
test('adminSeasonTeamsCommands.js exports assignAdminTeamCaptainCommand as a function', async () => {
  const mod = await import('../src/adminSeasonTeamsCommands.js');
  assert.equal(typeof mod.assignAdminTeamCaptainCommand, 'function');
});
test('availabilityCommands.js exports setRosterAvailabilityCommand as a function', async () => {
  const mod = await import('../src/availabilityCommands.js');
  assert.equal(typeof mod.setRosterAvailabilityCommand, 'function');
});
test('availabilityCommands.js exports listTeamRoundAvailabilityCommand as a function', async () => {
  const mod = await import('../src/availabilityCommands.js');
  assert.equal(typeof mod.listTeamRoundAvailabilityCommand, 'function');
});
test('chatCommands.js exports listChatThreadsCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listChatThreadsCommand, 'function');
});
test('chatCommands.js exports listTeamMessagesCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listTeamMessagesCommand, 'function');
});
test('chatCommands.js exports sendTeamMessageCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.sendTeamMessageCommand, 'function');
});
test('chatCommands.js exports markTeamChatReadCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.markTeamChatReadCommand, 'function');
});
test('chatCommands.js exports listDirectMessageCandidatesCommand as a function', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.equal(typeof mod.listDirectMessageCandidatesCommand, 'function');
});
