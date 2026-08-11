import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listChatThreadsCommand,
  listTeamMessagesCommand,
  markTeamChatReadCommand,
  sendTeamMessageCommand,
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
