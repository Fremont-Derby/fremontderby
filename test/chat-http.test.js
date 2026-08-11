import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleListChatThreadsRequest,
  handleListTeamMessagesRequest,
  handleSendTeamMessageRequest,
} from '../src/chatHttp.js';

function createFetch(responses) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url, init });
      const next = responses.shift() ?? { body: [] };
      return new Response(JSON.stringify(next.body), { status: next.status ?? 200 });
    },
  };
}

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
};

test('chat inbox handler authenticates the Google session before listing threads', async () => {
  const { fetch, calls } = createFetch([
    { body: { id: 'user-1', email: 'player@example.com' } },
    { body: [{ team_id: 'team-1', unread_count: 2 }] },
  ]);
  const request = new Request('https://fremontderby.com/api/me/chat-threads', {
    headers: { authorization: 'Bearer player-token' },
  });
  const response = await handleListChatThreadsRequest(request, env, { fetch });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).threads[0].unread_count, 2);
  assert.equal(calls[0].url, 'https://project.supabase.co/auth/v1/user');
  assert.equal(calls[1].url, 'https://project.supabase.co/rest/v1/rpc/get_my_team_chat_inbox');
});

test('team message list forwards bounded pagination', async () => {
  const { fetch, calls } = createFetch([
    { body: { id: 'user-1' } },
    { body: [{ message_id: 'message-1' }] },
  ]);
  const request = new Request('https://fremontderby.com/api/teams/team-1/messages?limit=25&before=2026-08-11T00:00:00Z', {
    headers: { authorization: 'Bearer token' },
  });
  const response = await handleListTeamMessagesRequest(request, env, 'team-1', { fetch });

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: 'user-1',
    target_team_id: 'team-1',
    before_created_at: '2026-08-11T00:00:00Z',
    result_limit: 25,
  });
});

test('team message post trims content and returns the created message', async () => {
  const { fetch, calls } = createFetch([
    { body: { id: 'user-1' } },
    { body: [{ message_id: 'message-1', body: 'Hello team' }] },
  ]);
  const request = new Request('https://fremontderby.com/api/teams/team-1/messages', {
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body: JSON.stringify({ body: '  Hello team  ', clientMessageId: 'client-1' }),
  });
  const response = await handleSendTeamMessageRequest(request, env, 'team-1', { fetch });

  assert.equal(response.status, 201);
  assert.equal((await response.json()).message.message_id, 'message-1');
  assert.equal(JSON.parse(calls[1].init.body).message_body, 'Hello team');
});

test('team message post maps inactive membership to forbidden', async () => {
  const { fetch } = createFetch([
    { body: { id: 'user-1' } },
    { status: 400, body: { message: 'Active team membership is required to post messages' } },
  ]);
  const request = new Request('https://fremontderby.com/api/teams/team-1/messages', {
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body: JSON.stringify({ body: 'Hello' }),
  });
  const response = await handleSendTeamMessageRequest(request, env, 'team-1', { fetch });
  assert.equal(response.status, 403);
});
