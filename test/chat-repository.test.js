import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatRepository } from '../src/chatRepository.js';

function createFetch(responses) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url, init });
      const response = responses.shift() ?? { status: 200, body: [] };
      return new Response(JSON.stringify(response.body), {
        status: response.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  };
}

const env = {
  SUPABASE_URL: 'https://project.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
};

test('chat repository calls the actor-scoped inbox RPC with service authority', async () => {
  const { fetch, calls } = createFetch([{ body: [{ team_id: 'team-1' }] }]);
  const repository = createChatRepository(env, { fetch });
  const result = await repository.listChatThreads({ actorUserId: 'user-1' });

  assert.equal(result[0].team_id, 'team-1');
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/get_my_team_chat_inbox');
  assert.equal(calls[0].init.headers.authorization, 'Bearer service-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), { actor_user_id: 'user-1' });
});

test('chat repository sends idempotent team messages and unwraps the saved row', async () => {
  const { fetch, calls } = createFetch([{ body: [{ message_id: 'message-1', body: 'Hello' }] }]);
  const repository = createChatRepository(env, { fetch });
  const message = await repository.sendTeamMessage({
    actorUserId: 'user-1', teamId: 'team-1', body: 'Hello', clientMessageId: 'client-1',
  });

  assert.equal(message.message_id, 'message-1');
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/send_team_chat_message');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_team_id: 'team-1',
    message_body: 'Hello',
    message_client_id: 'client-1',
  });
});

test('chat repository surfaces Supabase membership errors', async () => {
  const { fetch } = createFetch([{ status: 400, body: { message: 'Active team membership is required to post messages' } }]);
  const repository = createChatRepository(env, { fetch });
  await assert.rejects(
    repository.sendTeamMessage({ actorUserId: 'u', teamId: 't', body: 'Nope' }),
    /Active team membership is required/,
  );
});

test('chat repository starts a season-scoped direct conversation', async () => {
  const { fetch, calls } = createFetch([{ body: [{ conversation_id: 'conversation-1' }] }]);
  const repository = createChatRepository(env, { fetch });
  const conversation = await repository.startDirectConversation({
    actorUserId: 'user-1', seasonId: 'season-1', playerId: 'player-2',
  });

  assert.equal(conversation.conversation_id, 'conversation-1');
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/start_direct_conversation');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1', target_season_id: 'season-1', target_player_id: 'player-2',
  });
});

test('chat repository uses tuple cursor pagination and idempotency for direct messages', async () => {
  const { fetch, calls } = createFetch([
    { body: [] },
    { body: [{ message_id: 'message-1' }] },
  ]);
  const repository = createChatRepository(env, { fetch });
  await repository.listDirectMessages({
    actorUserId: 'user-1', conversationId: 'conversation-1',
    before: '2026-08-11T00:00:00Z', beforeMessageId: 'message-9', limit: 25,
  });
  await repository.sendDirectMessage({
    actorUserId: 'user-1', conversationId: 'conversation-1',
    body: 'Hello', clientMessageId: 'client-1',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/list_direct_messages');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1', target_conversation_id: 'conversation-1',
    before_created_at: '2026-08-11T00:00:00Z', before_message_id: 'message-9', result_limit: 25,
  });
  assert.equal(calls[1].url, 'https://project.supabase.co/rest/v1/rpc/send_direct_message');
  assert.equal(JSON.parse(calls[1].init.body).message_client_id, 'client-1');
});

test('chat repository blocks and unblocks by player id without contact data', async () => {
  const { fetch, calls } = createFetch([
    { body: [{ blocked_player_id: 'player-2' }] },
    { body: true },
  ]);
  const repository = createChatRepository(env, { fetch });
  await repository.blockPlayerChat({ actorUserId: 'user-1', playerId: 'player-2' });
  const unblocked = await repository.unblockPlayerChat({ actorUserId: 'user-1', playerId: 'player-2' });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/block_player_chat');
  assert.equal(calls[1].url, 'https://project.supabase.co/rest/v1/rpc/unblock_player_chat');
  assert.equal(unblocked, true);
  assert.doesNotMatch(calls.map((call) => call.init.body).join(' '), /email|phone/i);
});
