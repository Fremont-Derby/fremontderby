import test from 'node:test';
import assert from 'node:assert/strict';

test('adminCreatePlayerHttp.js exports handleCreateAdminPlayerRequest as a function', async () => {
  const mod = await import('../src/adminCreatePlayerHttp.js');
  assert.equal(typeof mod.handleCreateAdminPlayerRequest, 'function');
});
test('adminOperationsHttp.js exports handleAdminOperationsRequest as a function', async () => {
  const mod = await import('../src/adminOperationsHttp.js');
  assert.equal(typeof mod.handleAdminOperationsRequest, 'function');
});
test('adminPlayersHttp.js exports handleListAdminPlayersRequest as a function', async () => {
  const mod = await import('../src/adminPlayersHttp.js');
  assert.equal(typeof mod.handleListAdminPlayersRequest, 'function');
});
test('adminPlayersHttp.js exports handleSetAdminRoleRequest as a function', async () => {
  const mod = await import('../src/adminPlayersHttp.js');
  assert.equal(typeof mod.handleSetAdminRoleRequest, 'function');
});
test('chatHttp.js exports handleMessageNotificationSummaryRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleMessageNotificationSummaryRequest, 'function');
});
test('chatHttp.js exports handleListChatThreadsRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListChatThreadsRequest, 'function');
});
test('chatHttp.js exports handleListTeamMessagesRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListTeamMessagesRequest, 'function');
});
test('chatHttp.js exports handleSendTeamMessageRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleSendTeamMessageRequest, 'function');
});
test('chatHttp.js exports handleMarkTeamChatReadRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleMarkTeamChatReadRequest, 'function');
});
test('chatHttp.js exports handleListDirectMessageCandidatesRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListDirectMessageCandidatesRequest, 'function');
});
test('chatHttp.js exports handleListDirectMessageInboxRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListDirectMessageInboxRequest, 'function');
});
test('chatHttp.js exports handleStartDirectConversationRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleStartDirectConversationRequest, 'function');
});
