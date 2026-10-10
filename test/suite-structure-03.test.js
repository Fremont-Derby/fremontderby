import test from 'node:test';
import assert from 'node:assert/strict';

test('availabilityCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/availabilityCommands.js');
  const expected = ["setRosterAvailabilityCommand","listTeamRoundAvailabilityCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'availabilityCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('availabilityCommands.js exports setRosterAvailabilityCommand as a defined value', async () => {
  const mod = await import('../src/availabilityCommands.js');
  assert.notEqual(mod.setRosterAvailabilityCommand, undefined, 'setRosterAvailabilityCommand is missing');
});
test('availabilityCommands.js exports listTeamRoundAvailabilityCommand as a defined value', async () => {
  const mod = await import('../src/availabilityCommands.js');
  assert.notEqual(mod.listTeamRoundAvailabilityCommand, undefined, 'listTeamRoundAvailabilityCommand is missing');
});
test('availabilityPage.js loads and exports its named members', async () => {
  const mod = await import('../src/availabilityPage.js');
  const expected = ["renderAvailabilityPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'availabilityPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('availabilityPage.js exports renderAvailabilityPage as a defined value', async () => {
  const mod = await import('../src/availabilityPage.js');
  assert.notEqual(mod.renderAvailabilityPage, undefined, 'renderAvailabilityPage is missing');
});
test('availabilityPageCore.js loads and exports its named members', async () => {
  const mod = await import('../src/availabilityPageCore.js');
  const expected = ["renderAvailabilityPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'availabilityPageCore.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('availabilityPageCore.js exports renderAvailabilityPage as a defined value', async () => {
  const mod = await import('../src/availabilityPageCore.js');
  assert.notEqual(mod.renderAvailabilityPage, undefined, 'renderAvailabilityPage is missing');
});
test('availabilityRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/availabilityRepository.js');
  const expected = ["createAvailabilityRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'availabilityRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('availabilityRepository.js exports createAvailabilityRepository as a defined value', async () => {
  const mod = await import('../src/availabilityRepository.js');
  assert.notEqual(mod.createAvailabilityRepository, undefined, 'createAvailabilityRepository is missing');
});
test('blindLineupComponent.js loads and exports its named members', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  const expected = ["sharedBlindLineupStyles","sharedBlindLineupMarkup","sharedBlindLineupControllerSource","renderBlindLineupComponent"];
  for (const name of expected) {
    assert.ok(name in mod, 'blindLineupComponent.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('blindLineupComponent.js exports sharedBlindLineupStyles as a defined value', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  assert.notEqual(mod.sharedBlindLineupStyles, undefined, 'sharedBlindLineupStyles is missing');
});
test('blindLineupComponent.js exports sharedBlindLineupMarkup as a defined value', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  assert.notEqual(mod.sharedBlindLineupMarkup, undefined, 'sharedBlindLineupMarkup is missing');
});
test('blindLineupComponent.js exports sharedBlindLineupControllerSource as a defined value', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  assert.notEqual(mod.sharedBlindLineupControllerSource, undefined, 'sharedBlindLineupControllerSource is missing');
});
test('blindLineupComponent.js exports renderBlindLineupComponent as a defined value', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  assert.notEqual(mod.renderBlindLineupComponent, undefined, 'renderBlindLineupComponent is missing');
});
test('captainSandboxPage.js loads and exports its named members', async () => {
  const mod = await import('../src/captainSandboxPage.js');
  const expected = ["renderCaptainSandboxPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'captainSandboxPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('captainSandboxPage.js exports renderCaptainSandboxPage as a defined value', async () => {
  const mod = await import('../src/captainSandboxPage.js');
  assert.notEqual(mod.renderCaptainSandboxPage, undefined, 'renderCaptainSandboxPage is missing');
});
test('chatCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/chatCommands.js');
  const expected = ["listChatThreadsCommand","listTeamMessagesCommand","sendTeamMessageCommand","markTeamChatReadCommand","listDirectMessageCandidatesCommand","listDirectMessageInboxCommand","startDirectConversationCommand","listDirectMessagesCommand","sendDirectMessageCommand","markDirectChatReadCommand","blockPlayerChatCommand","unblockPlayerChatCommand","listBlockedChatPlayersCommand","listLeagueChatThreadsCommand","listLeagueMessagesCommand","sendLeagueMessageCommand","markLeagueChatReadCommand","reportChatMessageCommand","listChatReportsCommand","moderateChatReportCommand","listMatchupChatThreadsCommand","listMatchupMessagesCommand","sendMatchupMessageCommand","markMatchupChatReadCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatCommands.js exports listChatThreadsCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listChatThreadsCommand, undefined, 'listChatThreadsCommand is missing');
});
test('chatCommands.js exports listTeamMessagesCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listTeamMessagesCommand, undefined, 'listTeamMessagesCommand is missing');
});
test('chatCommands.js exports sendTeamMessageCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.sendTeamMessageCommand, undefined, 'sendTeamMessageCommand is missing');
});
test('chatCommands.js exports markTeamChatReadCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.markTeamChatReadCommand, undefined, 'markTeamChatReadCommand is missing');
});
test('chatCommands.js exports listDirectMessageCandidatesCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listDirectMessageCandidatesCommand, undefined, 'listDirectMessageCandidatesCommand is missing');
});
test('chatCommands.js exports listDirectMessageInboxCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listDirectMessageInboxCommand, undefined, 'listDirectMessageInboxCommand is missing');
});
test('chatCommands.js exports startDirectConversationCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.startDirectConversationCommand, undefined, 'startDirectConversationCommand is missing');
});
test('chatCommands.js exports listDirectMessagesCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listDirectMessagesCommand, undefined, 'listDirectMessagesCommand is missing');
});
test('chatCommands.js exports sendDirectMessageCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.sendDirectMessageCommand, undefined, 'sendDirectMessageCommand is missing');
});
test('chatCommands.js exports markDirectChatReadCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.markDirectChatReadCommand, undefined, 'markDirectChatReadCommand is missing');
});
test('chatCommands.js exports blockPlayerChatCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.blockPlayerChatCommand, undefined, 'blockPlayerChatCommand is missing');
});
test('chatCommands.js exports unblockPlayerChatCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.unblockPlayerChatCommand, undefined, 'unblockPlayerChatCommand is missing');
});
test('chatCommands.js exports listBlockedChatPlayersCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listBlockedChatPlayersCommand, undefined, 'listBlockedChatPlayersCommand is missing');
});
test('chatCommands.js exports listLeagueChatThreadsCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listLeagueChatThreadsCommand, undefined, 'listLeagueChatThreadsCommand is missing');
});
test('chatCommands.js exports listLeagueMessagesCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listLeagueMessagesCommand, undefined, 'listLeagueMessagesCommand is missing');
});
test('chatCommands.js exports sendLeagueMessageCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.sendLeagueMessageCommand, undefined, 'sendLeagueMessageCommand is missing');
});
test('chatCommands.js exports markLeagueChatReadCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.markLeagueChatReadCommand, undefined, 'markLeagueChatReadCommand is missing');
});
test('chatCommands.js exports reportChatMessageCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.reportChatMessageCommand, undefined, 'reportChatMessageCommand is missing');
});
test('chatCommands.js exports listChatReportsCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listChatReportsCommand, undefined, 'listChatReportsCommand is missing');
});
test('chatCommands.js exports moderateChatReportCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.moderateChatReportCommand, undefined, 'moderateChatReportCommand is missing');
});
test('chatCommands.js exports listMatchupChatThreadsCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listMatchupChatThreadsCommand, undefined, 'listMatchupChatThreadsCommand is missing');
});
test('chatCommands.js exports listMatchupMessagesCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.listMatchupMessagesCommand, undefined, 'listMatchupMessagesCommand is missing');
});
test('chatCommands.js exports sendMatchupMessageCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.sendMatchupMessageCommand, undefined, 'sendMatchupMessageCommand is missing');
});
test('chatCommands.js exports markMatchupChatReadCommand as a defined value', async () => {
  const mod = await import('../src/chatCommands.js');
  assert.notEqual(mod.markMatchupChatReadCommand, undefined, 'markMatchupChatReadCommand is missing');
});
test('chatHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/chatHttp.js');
  const expected = ["handleMessageNotificationSummaryRequest","handleListChatThreadsRequest","handleListTeamMessagesRequest","handleSendTeamMessageRequest","handleMarkTeamChatReadRequest","chatHttpHandlers","handleListDirectMessageCandidatesRequest","handleListDirectMessageInboxRequest","handleStartDirectConversationRequest","handleListDirectMessagesRequest","handleSendDirectMessageRequest","handleMarkDirectChatReadRequest","handleBlockPlayerChatRequest","handleUnblockPlayerChatRequest","handleListBlockedChatPlayersRequest","handleListLeagueChatThreadsRequest","handleListLeagueMessagesRequest","handleSendLeagueMessageRequest","handleMarkLeagueChatReadRequest","handleReportChatMessageRequest","handleListChatReportsRequest","handleModerateChatReportRequest","handleListMatchupChatThreadsRequest","handleListMatchupMessagesRequest","handleSendMatchupMessageRequest","handleMarkMatchupChatReadRequest"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatHttp.js exports handleMessageNotificationSummaryRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleMessageNotificationSummaryRequest, undefined, 'handleMessageNotificationSummaryRequest is missing');
});
test('chatHttp.js exports handleListChatThreadsRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListChatThreadsRequest, undefined, 'handleListChatThreadsRequest is missing');
});
test('chatHttp.js exports handleListTeamMessagesRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListTeamMessagesRequest, undefined, 'handleListTeamMessagesRequest is missing');
});
test('chatHttp.js exports handleSendTeamMessageRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleSendTeamMessageRequest, undefined, 'handleSendTeamMessageRequest is missing');
});
test('chatHttp.js exports handleMarkTeamChatReadRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleMarkTeamChatReadRequest, undefined, 'handleMarkTeamChatReadRequest is missing');
});
test('chatHttp.js exports chatHttpHandlers as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.chatHttpHandlers, undefined, 'chatHttpHandlers is missing');
});
test('chatHttp.js exports handleListDirectMessageCandidatesRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListDirectMessageCandidatesRequest, undefined, 'handleListDirectMessageCandidatesRequest is missing');
});
test('chatHttp.js exports handleListDirectMessageInboxRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListDirectMessageInboxRequest, undefined, 'handleListDirectMessageInboxRequest is missing');
});
test('chatHttp.js exports handleStartDirectConversationRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleStartDirectConversationRequest, undefined, 'handleStartDirectConversationRequest is missing');
});
test('chatHttp.js exports handleListDirectMessagesRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListDirectMessagesRequest, undefined, 'handleListDirectMessagesRequest is missing');
});
test('chatHttp.js exports handleSendDirectMessageRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleSendDirectMessageRequest, undefined, 'handleSendDirectMessageRequest is missing');
});
test('chatHttp.js exports handleMarkDirectChatReadRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleMarkDirectChatReadRequest, undefined, 'handleMarkDirectChatReadRequest is missing');
});
test('chatHttp.js exports handleBlockPlayerChatRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleBlockPlayerChatRequest, undefined, 'handleBlockPlayerChatRequest is missing');
});
test('chatHttp.js exports handleUnblockPlayerChatRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleUnblockPlayerChatRequest, undefined, 'handleUnblockPlayerChatRequest is missing');
});
test('chatHttp.js exports handleListBlockedChatPlayersRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListBlockedChatPlayersRequest, undefined, 'handleListBlockedChatPlayersRequest is missing');
});
test('chatHttp.js exports handleListLeagueChatThreadsRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListLeagueChatThreadsRequest, undefined, 'handleListLeagueChatThreadsRequest is missing');
});
test('chatHttp.js exports handleListLeagueMessagesRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListLeagueMessagesRequest, undefined, 'handleListLeagueMessagesRequest is missing');
});
test('chatHttp.js exports handleSendLeagueMessageRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleSendLeagueMessageRequest, undefined, 'handleSendLeagueMessageRequest is missing');
});
test('chatHttp.js exports handleMarkLeagueChatReadRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleMarkLeagueChatReadRequest, undefined, 'handleMarkLeagueChatReadRequest is missing');
});
test('chatHttp.js exports handleReportChatMessageRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleReportChatMessageRequest, undefined, 'handleReportChatMessageRequest is missing');
});
test('chatHttp.js exports handleListChatReportsRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListChatReportsRequest, undefined, 'handleListChatReportsRequest is missing');
});
test('chatHttp.js exports handleModerateChatReportRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleModerateChatReportRequest, undefined, 'handleModerateChatReportRequest is missing');
});
test('chatHttp.js exports handleListMatchupChatThreadsRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListMatchupChatThreadsRequest, undefined, 'handleListMatchupChatThreadsRequest is missing');
});
test('chatHttp.js exports handleListMatchupMessagesRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleListMatchupMessagesRequest, undefined, 'handleListMatchupMessagesRequest is missing');
});
test('chatHttp.js exports handleSendMatchupMessageRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleSendMatchupMessageRequest, undefined, 'handleSendMatchupMessageRequest is missing');
});
test('chatHttp.js exports handleMarkMatchupChatReadRequest as a defined value', async () => {
  const mod = await import('../src/chatHttp.js');
  assert.notEqual(mod.handleMarkMatchupChatReadRequest, undefined, 'handleMarkMatchupChatReadRequest is missing');
});
test('chatModerationPage.js loads and exports its named members', async () => {
  const mod = await import('../src/chatModerationPage.js');
  const expected = ["renderChatModerationPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatModerationPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatModerationPage.js exports renderChatModerationPage as a defined value', async () => {
  const mod = await import('../src/chatModerationPage.js');
  assert.notEqual(mod.renderChatModerationPage, undefined, 'renderChatModerationPage is missing');
});
test('chatPage.js loads and exports its named members', async () => {
  const mod = await import('../src/chatPage.js');
  const expected = ["renderChatPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatPage.js exports renderChatPage as a defined value', async () => {
  const mod = await import('../src/chatPage.js');
  assert.notEqual(mod.renderChatPage, undefined, 'renderChatPage is missing');
});
