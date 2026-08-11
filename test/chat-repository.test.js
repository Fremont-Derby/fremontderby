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
