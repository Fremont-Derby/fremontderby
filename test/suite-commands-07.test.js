import test from 'node:test';
import assert from 'node:assert/strict';

test('teamCommands.js exports invitePlayerToTeamCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.invitePlayerToTeamCommand, 'function');
});
test('teamCommands.js exports proposeTeamTradeCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.proposeTeamTradeCommand, 'function');
});
test('teamCommands.js exports adminProposeTeamTradeExceptionCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.adminProposeTeamTradeExceptionCommand, 'function');
});
test('teamCommands.js exports respondToTeamInvitationCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.respondToTeamInvitationCommand, 'function');
});
test('teamCommands.js exports respondToTeamTradePlayerCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.respondToTeamTradePlayerCommand, 'function');
});
test('teamCommands.js exports approveTeamTradeCaptainCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.approveTeamTradeCaptainCommand, 'function');
});
test('teamCommands.js exports cancelTeamInvitationCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.cancelTeamInvitationCommand, 'function');
});
test('teamCommands.js exports removeTeamMemberCommand as a function', async () => {
  const mod = await import('../src/teamCommands.js');
  assert.equal(typeof mod.removeTeamMemberCommand, 'function');
});
test('teamMatchChoiceCommands.js exports listMyTeamMatchChoicesCommand as a function', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  assert.equal(typeof mod.listMyTeamMatchChoicesCommand, 'function');
});
test('teamMatchChoiceCommands.js exports chooseTeamMatchTeamCommand as a function', async () => {
  const mod = await import('../src/teamMatchChoiceCommands.js');
  assert.equal(typeof mod.chooseTeamMatchTeamCommand, 'function');
});
