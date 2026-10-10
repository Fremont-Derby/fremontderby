import test from 'node:test';
import assert from 'node:assert/strict';

test('index.js exports handleCancelTeamMembershipRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleCancelTeamMembershipRequest, 'function');
});
test('index.js exports handleListOwnTeamManagementRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListOwnTeamManagementRequest, 'function');
});
test('index.js exports handleListOwnTeamTradesRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListOwnTeamTradesRequest, 'function');
});
test('index.js exports handleInvitePlayerToTeamRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleInvitePlayerToTeamRequest, 'function');
});
test('index.js exports handleProposeTeamTradeRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleProposeTeamTradeRequest, 'function');
});
test('index.js exports handleAdminProposeTeamTradeExceptionRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleAdminProposeTeamTradeExceptionRequest, 'function');
});
test('index.js exports handleRespondToTeamInvitationRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRespondToTeamInvitationRequest, 'function');
});
test('index.js exports handleRespondToTeamTradePlayerRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRespondToTeamTradePlayerRequest, 'function');
});
test('index.js exports handleApproveTeamTradeCaptainRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleApproveTeamTradeCaptainRequest, 'function');
});
test('index.js exports handleCancelTeamInvitationRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleCancelTeamInvitationRequest, 'function');
});
test('index.js exports handleRemoveTeamMemberRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRemoveTeamMemberRequest, 'function');
});
test('index.js exports handleRegisterFreeAgentRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRegisterFreeAgentRequest, 'function');
});
