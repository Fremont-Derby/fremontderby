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
test('availabilityPage.js loads and exports its named members', async () => {
  const mod = await import('../src/availabilityPage.js');
  const expected = ["renderAvailabilityPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'availabilityPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('availabilityPageCore.js loads and exports its named members', async () => {
  const mod = await import('../src/availabilityPageCore.js');
  const expected = ["renderAvailabilityPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'availabilityPageCore.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('availabilityRepository.js loads and exports its named members', async () => {
  const mod = await import('../src/availabilityRepository.js');
  const expected = ["createAvailabilityRepository"];
  for (const name of expected) {
    assert.ok(name in mod, 'availabilityRepository.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('blindLineupComponent.js loads and exports its named members', async () => {
  const mod = await import('../src/blindLineupComponent.js');
  const expected = ["sharedBlindLineupStyles","sharedBlindLineupMarkup","sharedBlindLineupControllerSource","renderBlindLineupComponent"];
  for (const name of expected) {
    assert.ok(name in mod, 'blindLineupComponent.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('captainSandboxPage.js loads and exports its named members', async () => {
  const mod = await import('../src/captainSandboxPage.js');
  const expected = ["renderCaptainSandboxPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'captainSandboxPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatCommands.js loads and exports its named members', async () => {
  const mod = await import('../src/chatCommands.js');
  const expected = ["listChatThreadsCommand","listTeamMessagesCommand","sendTeamMessageCommand","markTeamChatReadCommand","listDirectMessageCandidatesCommand","listDirectMessageInboxCommand","startDirectConversationCommand","listDirectMessagesCommand","sendDirectMessageCommand","markDirectChatReadCommand","blockPlayerChatCommand","unblockPlayerChatCommand","listBlockedChatPlayersCommand","listLeagueChatThreadsCommand","listLeagueMessagesCommand","sendLeagueMessageCommand","markLeagueChatReadCommand","reportChatMessageCommand","listChatReportsCommand","moderateChatReportCommand","listMatchupChatThreadsCommand","listMatchupMessagesCommand","sendMatchupMessageCommand","markMatchupChatReadCommand"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatCommands.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatHttp.js loads and exports its named members', async () => {
  const mod = await import('../src/chatHttp.js');
  const expected = ["handleMessageNotificationSummaryRequest","handleListChatThreadsRequest","handleListTeamMessagesRequest","handleSendTeamMessageRequest","handleMarkTeamChatReadRequest","chatHttpHandlers","handleListDirectMessageCandidatesRequest","handleListDirectMessageInboxRequest","handleStartDirectConversationRequest","handleListDirectMessagesRequest","handleSendDirectMessageRequest","handleMarkDirectChatReadRequest","handleBlockPlayerChatRequest","handleUnblockPlayerChatRequest","handleListBlockedChatPlayersRequest","handleListLeagueChatThreadsRequest","handleListLeagueMessagesRequest","handleSendLeagueMessageRequest","handleMarkLeagueChatReadRequest","handleReportChatMessageRequest","handleListChatReportsRequest","handleModerateChatReportRequest","handleListMatchupChatThreadsRequest","handleListMatchupMessagesRequest","handleSendMatchupMessageRequest","handleMarkMatchupChatReadRequest"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatHttp.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatModerationPage.js loads and exports its named members', async () => {
  const mod = await import('../src/chatModerationPage.js');
  const expected = ["renderChatModerationPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatModerationPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
test('chatPage.js loads and exports its named members', async () => {
  const mod = await import('../src/chatPage.js');
  const expected = ["renderChatPage"];
  for (const name of expected) {
    assert.ok(name in mod, 'chatPage.js is missing ' + name);
    assert.notEqual(mod[name], undefined);
  }
});
