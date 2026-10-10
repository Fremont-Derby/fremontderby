import test from 'node:test';
import assert from 'node:assert/strict';

test('chatHttp.js exports handleModerateChatReportRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleModerateChatReportRequest, 'function');
});
test('chatHttp.js exports handleListMatchupChatThreadsRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListMatchupChatThreadsRequest, 'function');
});
test('chatHttp.js exports handleListMatchupMessagesRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleListMatchupMessagesRequest, 'function');
});
test('chatHttp.js exports handleSendMatchupMessageRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleSendMatchupMessageRequest, 'function');
});
test('chatHttp.js exports handleMarkMatchupChatReadRequest as a function', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.equal(typeof mod.handleMarkMatchupChatReadRequest, 'function');
});
test('index.js exports handlePublishScheduleRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handlePublishScheduleRequest, 'function');
});
test('index.js exports handleCreateSeasonSetupRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleCreateSeasonSetupRequest, 'function');
});
test('index.js exports handleListAdminSeasonsRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleListAdminSeasonsRequest, 'function');
});
test('index.js exports handleGetSeasonSetupRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleGetSeasonSetupRequest, 'function');
});
test('index.js exports handleUpdateSeasonSetupRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleUpdateSeasonSetupRequest, 'function');
});
test('index.js exports handleGetOwnProfileRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleGetOwnProfileRequest, 'function');
});
test('index.js exports handleSaveOwnProfileRequest as a function', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handleSaveOwnProfileRequest, 'function');
});
