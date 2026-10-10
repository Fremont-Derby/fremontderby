import test from 'node:test';
import assert from 'node:assert/strict';

test('index.js exports handleCreateTeamRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleCreateTeamRequest, 'function');
});
test('index.js exports handleGetOwnTeamRegistrationRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleGetOwnTeamRegistrationRequest, 'function');
});
test('index.js exports handleWithdrawTeamApplicationRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleWithdrawTeamApplicationRequest, 'function');
});
test('index.js exports handleRespondToReturningTeamSlotRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRespondToReturningTeamSlotRequest, 'function');
});
test('index.js exports handleGetAdminSeasonRegistrationRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleGetAdminSeasonRegistrationRequest, 'function');
});
test('index.js exports handleConfigureSeasonRegistrationRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleConfigureSeasonRegistrationRequest, 'function');
});
test('index.js exports handleReviewTeamApplicationRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleReviewTeamApplicationRequest, 'function');
});
test('index.js exports handleManageTeamSlotRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleManageTeamSlotRequest, 'function');
});
test('index.js exports handleSeedReturningTeamSlotsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleSeedReturningTeamSlotsRequest, 'function');
});
test('index.js exports handleListOwnTeamMembershipRequestsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListOwnTeamMembershipRequestsRequest, 'function');
});
test('index.js exports handleRequestTeamMembershipRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRequestTeamMembershipRequest, 'function');
});
test('index.js exports handleRespondToTeamMembershipRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleRespondToTeamMembershipRequest, 'function');
});
