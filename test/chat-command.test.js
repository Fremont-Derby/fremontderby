import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blockPlayerChatCommand,
  listChatThreadsCommand,
  listDirectMessagesCommand,
  listLeagueMessagesCommand,
  listMatchupMessagesCommand,
  listTeamMessagesCommand,
  markTeamChatReadCommand,
  sendDirectMessageCommand,
  sendLeagueMessageCommand,
  sendMatchupMessageCommand,
  sendTeamMessageCommand,
  startDirectConversationCommand,
  reportChatMessageCommand,
  moderateChatReportCommand,
} from '../src/chatCommands.js';

test('chat commands pass actor-scoped team operations to the repository', async () => {
  const calls = [];
  const repository = {
    listChatThreads: async (input) => { calls.push(['threads', input]); return []; },
    listTeamMessages: async (input) => { calls.push(['list', input]); return []; },
    sendTeamMessage: async (input) => { calls.push(['send', input]); return input; },
    markTeamChatRead: async (input) => { calls.push(['read', input]); return input; },
  };

  await listChatThreadsCommand({ actorUserId: 'user-1' }, repository);
  await listTeamMessagesCommand({ actorUserId: 'user-1', teamId: 'team-1' }, repository);
  await sendTeamMessageCommand({
    actorUserId: 'user-1', teamId: 'team-1', body: '  Match at seven?  ', clientMessageId: 'client-1',
  }, repository);
  await markTeamChatReadCommand({ actorUserId: 'user-1', teamId: 'team-1' }, repository);

  assert.deepEqual(calls, [
    ['threads', { actorUserId: 'user-1' }],
    ['list', { actorUserId: 'user-1', teamId: 'team-1', before: null, limit: 50 }],
    ['send', {
      actorUserId: 'user-1', teamId: 'team-1', body: 'Match at seven?', clientMessageId: 'client-1',
    }],
    ['read', { actorUserId: 'user-1', teamId: 'team-1', readAt: null }],
  ]);
});

test('matchup chat commands preserve match scope and allow matchup reports', async () => {
  const calls = [];
  const repository = {
    listMatchupMessages: async (input) => { calls.push(['list', input]); return []; },
    sendMatchupMessage: async (input) => { calls.push(['send', input]); return input; },
    reportChatMessage: async (input) => { calls.push(['report', input]); return input; },
  };
  await listMatchupMessagesCommand({
    actorUserId: 'user-1', teamMatchId: 'match-1', limit: 30,
  }, repository);
  await sendMatchupMessageCommand({
    actorUserId: 'user-1', teamMatchId: 'match-1', body: ' Table 3? ',
    clientMessageId: 'client-1',
  }, repository);
  await reportChatMessageCommand({
    actorUserId: 'user-1', messageType: 'matchup', messageId: 'message-1', reason: 'spam',
  }, repository);
  assert.deepEqual(calls, [
    ['list', {
      actorUserId: 'user-1', teamMatchId: 'match-1', before: null,
      beforeMessageId: null, limit: 30,
    }],
    ['send', {
      actorUserId: 'user-1', teamMatchId: 'match-1', body: 'Table 3?', clientMessageId: 'client-1',
    }],
    ['report', {
      actorUserId: 'user-1', messageType: 'matchup', messageId: 'message-1',
      reason: 'spam', details: null,
    }],
  ]);
});

test('league chat and report commands normalize trusted inputs', async () => {
  const calls = [];
  const repository = {
    listLeagueMessages: async (input) => { calls.push(['list', input]); return []; },
    sendLeagueMessage: async (input) => { calls.push(['send', input]); return input; },
    reportChatMessage: async (input) => { calls.push(['report', input]); return input; },
    moderateChatReport: async (input) => { calls.push(['moderate', input]); return input; },
  };
  await listLeagueMessagesCommand({
    actorUserId: 'user-1', seasonId: 'season-1', limit: 20,
    before: '2026-08-11T00:00:00Z', beforeMessageId: 'message-9',
  }, repository);
  await sendLeagueMessageCommand({
    actorUserId: 'user-1', seasonId: 'season-1', body: '  League night!  ',
    clientMessageId: 'client-1',
  }, repository);
  await reportChatMessageCommand({
    actorUserId: 'user-1', messageType: 'LEAGUE', messageId: 'message-1',
    reason: 'SPAM', details: '  repeated links  ',
  }, repository);
  await moderateChatReportCommand({
    actorUserId: 'admin-1', reportId: 'report-1', resolution: 'RESOLVED',
    note: '  reviewed  ', removeMessage: true,
  }, repository);

  assert.deepEqual(calls, [
    ['list', {
      actorUserId: 'user-1', seasonId: 'season-1', before: '2026-08-11T00:00:00Z',
      beforeMessageId: 'message-9', limit: 20,
    }],
    ['send', {
      actorUserId: 'user-1', seasonId: 'season-1', body: 'League night!',
      clientMessageId: 'client-1',
    }],
    ['report', {
      actorUserId: 'user-1', messageType: 'league', messageId: 'message-1',
      reason: 'spam', details: 'repeated links',
    }],
    ['moderate', {
      actorUserId: 'admin-1', reportId: 'report-1', resolution: 'resolved',
      note: 'reviewed', removeMessage: true,
    }],
  ]);
});

test('report and moderation commands reject unsupported or inconsistent actions', async () => {
  const repository = { reportChatMessage: async () => null, moderateChatReport: async () => null };
  await assert.rejects(reportChatMessageCommand({
    actorUserId: 'u', messageType: 'channel', messageId: 'm', reason: 'spam',
  }, repository), /Unsupported/);
  await assert.rejects(reportChatMessageCommand({
    actorUserId: 'u', messageType: 'team', messageId: 'm', reason: 'unknown',
  }, repository), /valid report reason/);
  await assert.rejects(moderateChatReportCommand({
    actorUserId: 'u', reportId: 'r', resolution: 'dismissed', removeMessage: true,
  }, repository), /removed message must use resolved/);
});

test('direct message commands keep actor, season, player, and conversation scope', async () => {
  const calls = [];
  const repository = {
    startDirectConversation: async (input) => { calls.push(['start', input]); return input; },
    listDirectMessages: async (input) => { calls.push(['list', input]); return []; },
    sendDirectMessage: async (input) => { calls.push(['send', input]); return input; },
    blockPlayerChat: async (input) => { calls.push(['block', input]); return input; },
  };

  await startDirectConversationCommand({
    actorUserId: 'user-1', seasonId: 'season-1', playerId: 'player-2',
  }, repository);
  await listDirectMessagesCommand({
    actorUserId: 'user-1', conversationId: 'conversation-1',
    before: '2026-08-11T00:00:00Z', beforeMessageId: 'message-9', limit: 25,
  }, repository);
  await sendDirectMessageCommand({
    actorUserId: 'user-1', conversationId: 'conversation-1',
    body: '  See you there  ', clientMessageId: 'client-1',
  }, repository);
  await blockPlayerChatCommand({ actorUserId: 'user-1', playerId: 'player-2' }, repository);

  assert.deepEqual(calls, [
    ['start', { actorUserId: 'user-1', seasonId: 'season-1', playerId: 'player-2' }],
    ['list', {
      actorUserId: 'user-1', conversationId: 'conversation-1',
      before: '2026-08-11T00:00:00Z', beforeMessageId: 'message-9', limit: 25,
    }],
    ['send', {
      actorUserId: 'user-1', conversationId: 'conversation-1',
      body: 'See you there', clientMessageId: 'client-1',
    }],
    ['block', { actorUserId: 'user-1', playerId: 'player-2' }],
  ]);
});

test('direct messages use the same bounded content and pagination rules', async () => {
  const repository = { sendDirectMessage: async () => null, listDirectMessages: async () => [] };
  await assert.rejects(
    sendDirectMessageCommand({ actorUserId: 'u', conversationId: 'c', body: '  ' }, repository),
    /cannot be empty/,
  );
  await assert.rejects(
    sendDirectMessageCommand({ actorUserId: 'u', conversationId: 'c', body: 'x'.repeat(2001) }, repository),
    /cannot exceed 2000/,
  );
  await assert.rejects(
    listDirectMessagesCommand({ actorUserId: 'u', conversationId: 'c', limit: 0 }, repository),
    /between 1 and 100/,
  );
});

test('team messages reject empty, oversized, and invalid page requests', async () => {
  const repository = { sendTeamMessage: async () => null, listTeamMessages: async () => [] };
  await assert.rejects(
    sendTeamMessageCommand({ actorUserId: 'u', teamId: 't', body: '   ' }, repository),
    /cannot be empty/,
  );
  await assert.rejects(
    sendTeamMessageCommand({ actorUserId: 'u', teamId: 't', body: 'x'.repeat(2001) }, repository),
    /cannot exceed 2000/,
  );
  await assert.rejects(
    listTeamMessagesCommand({ actorUserId: 'u', teamId: 't', limit: 101 }, repository),
    /between 1 and 100/,
  );
});
