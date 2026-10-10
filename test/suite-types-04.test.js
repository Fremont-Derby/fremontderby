import test from 'node:test';
import assert from 'node:assert/strict';

test('blindLineupComponent.js sharedBlindLineupStyles has a usable type', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  const value = mod.sharedBlindLineupStyles;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('blindLineupComponent.js sharedBlindLineupMarkup has a usable type', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  const value = mod.sharedBlindLineupMarkup;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('blindLineupComponent.js sharedBlindLineupControllerSource has a usable type', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  const value = mod.sharedBlindLineupControllerSource;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('blindLineupComponent.js renderBlindLineupComponent has a usable type', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  const value = mod.renderBlindLineupComponent;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('captainSandboxPage.js renderCaptainSandboxPage has a usable type', async () => {
  const mod = await import('../src/captainSandboxPage.js');
  const value = mod.renderCaptainSandboxPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listChatThreadsCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listChatThreadsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listTeamMessagesCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listTeamMessagesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js sendTeamMessageCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.sendTeamMessageCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js markTeamChatReadCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.markTeamChatReadCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listDirectMessageCandidatesCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listDirectMessageCandidatesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listDirectMessageInboxCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listDirectMessageInboxCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js startDirectConversationCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.startDirectConversationCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listDirectMessagesCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listDirectMessagesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js sendDirectMessageCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.sendDirectMessageCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js markDirectChatReadCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.markDirectChatReadCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js blockPlayerChatCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.blockPlayerChatCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js unblockPlayerChatCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.unblockPlayerChatCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listBlockedChatPlayersCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listBlockedChatPlayersCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listLeagueChatThreadsCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listLeagueChatThreadsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listLeagueMessagesCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listLeagueMessagesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js sendLeagueMessageCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.sendLeagueMessageCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js markLeagueChatReadCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.markLeagueChatReadCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js reportChatMessageCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.reportChatMessageCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listChatReportsCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listChatReportsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js moderateChatReportCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.moderateChatReportCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listMatchupChatThreadsCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listMatchupChatThreadsCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js listMatchupMessagesCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.listMatchupMessagesCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js sendMatchupMessageCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.sendMatchupMessageCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatCommands.js markMatchupChatReadCommand has a usable type', async () => {
  const mod = await import('../src/chatCommands.js');
  const value = mod.markMatchupChatReadCommand;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleMessageNotificationSummaryRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleMessageNotificationSummaryRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListChatThreadsRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListChatThreadsRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListTeamMessagesRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListTeamMessagesRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleSendTeamMessageRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleSendTeamMessageRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleMarkTeamChatReadRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleMarkTeamChatReadRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js chatHttpHandlers has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.chatHttpHandlers;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListDirectMessageCandidatesRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListDirectMessageCandidatesRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListDirectMessageInboxRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListDirectMessageInboxRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleStartDirectConversationRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleStartDirectConversationRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListDirectMessagesRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListDirectMessagesRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleSendDirectMessageRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleSendDirectMessageRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleMarkDirectChatReadRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleMarkDirectChatReadRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleBlockPlayerChatRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleBlockPlayerChatRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleUnblockPlayerChatRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleUnblockPlayerChatRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListBlockedChatPlayersRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListBlockedChatPlayersRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListLeagueChatThreadsRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListLeagueChatThreadsRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListLeagueMessagesRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListLeagueMessagesRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleSendLeagueMessageRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleSendLeagueMessageRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleMarkLeagueChatReadRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleMarkLeagueChatReadRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleReportChatMessageRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleReportChatMessageRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListChatReportsRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListChatReportsRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleModerateChatReportRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleModerateChatReportRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListMatchupChatThreadsRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListMatchupChatThreadsRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleListMatchupMessagesRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleListMatchupMessagesRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleSendMatchupMessageRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleSendMatchupMessageRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatHttp.js handleMarkMatchupChatReadRequest has a usable type', async () => {
  const mod = await import('../src/chatHttp.js');
  const value = mod.handleMarkMatchupChatReadRequest;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatModerationPage.js renderChatModerationPage has a usable type', async () => {
  const mod = await import('../src/chatModerationPage.js');
  const value = mod.renderChatModerationPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatPage.js renderChatPage has a usable type', async () => {
  const mod = await import('../src/chatPage.js');
  const value = mod.renderChatPage;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('chatRepository.js createChatRepository has a usable type', async () => {
  const mod = await import('../src/chatRepository.js');
  const value = mod.createChatRepository;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
test('dateAvailabilityHttp.js routeDateAvailability has a usable type', async () => {
  const mod = await import('../src/dateAvailabilityHttp.js');
  const value = mod.routeDateAvailability;
  assert.ok(['function', 'string', 'number', 'object', 'boolean'].includes(typeof value), typeof value);
  if (typeof value === 'object') assert.notEqual(value, null);
});
