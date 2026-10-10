import test from 'node:test';
import assert from 'node:assert/strict';

test('chatHttp.js exports handleListDirectMessagesRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListDirectMessagesRequest, 'function');
});
test('chatHttp.js exports handleSendDirectMessageRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleSendDirectMessageRequest, 'function');
});
test('chatHttp.js exports handleMarkDirectChatReadRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleMarkDirectChatReadRequest, 'function');
});
test('chatHttp.js exports handleBlockPlayerChatRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleBlockPlayerChatRequest, 'function');
});
test('chatHttp.js exports handleUnblockPlayerChatRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleUnblockPlayerChatRequest, 'function');
});
test('chatHttp.js exports handleListBlockedChatPlayersRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListBlockedChatPlayersRequest, 'function');
});
test('chatHttp.js exports handleListLeagueChatThreadsRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListLeagueChatThreadsRequest, 'function');
});
test('chatHttp.js exports handleListLeagueMessagesRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListLeagueMessagesRequest, 'function');
});
test('chatHttp.js exports handleSendLeagueMessageRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleSendLeagueMessageRequest, 'function');
});
test('chatHttp.js exports handleMarkLeagueChatReadRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleMarkLeagueChatReadRequest, 'function');
});
test('chatHttp.js exports handleReportChatMessageRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleReportChatMessageRequest, 'function');
});
test('chatHttp.js exports handleListChatReportsRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListChatReportsRequest, 'function');
});
