import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blockPlayerChatCommand,
  listChatThreadsCommand,
  listDirectMessagesCommand,
  listTeamMessagesCommand,
  markTeamChatReadCommand,
  sendDirectMessageCommand,
  sendTeamMessageCommand,
  startDirectConversationCommand,
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
