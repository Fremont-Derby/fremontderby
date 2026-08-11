import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleBlockPlayerChatRequest,
  handleListChatThreadsRequest,
  handleListDirectMessagesRequest,
  handleListLeagueMessagesRequest,
  handleReportChatMessageRequest,
  handleModerateChatReportRequest,
  handleSendDirectMessageRequest,
  handleListTeamMessagesRequest,
  handleSendTeamMessageRequest,
  handleStartDirectConversationRequest,
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

test('league chat HTTP handlers preserve tuple cursor and idempotent sends', async () => {
  const listFetch = createFetch([
    { body: { id: 'user-1' } }, { body: [{ message_id: 'message-1' }] },
  ]);
  const request = new Request(
    'https://fremontderby.com/api/seasons/season-1/messages?limit=20&before=2026-08-11T00:00:00Z&beforeMessageId=message-9',
    { headers: { authorization: 'Bearer token' } },
  );
  const response = await handleListLeagueMessagesRequest(
    request, env, 'season-1', { fetch: listFetch.fetch },
  );
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(listFetch.calls[1].init.body).before_message_id, 'message-9');
});

test('message reports authenticate players and moderation authenticates admins', async () => {
  const reportFetch = createFetch([
    { body: { id: 'user-1' } }, { body: [{ report_id: 'report-1' }] },
  ]);
  const reportRequest = new Request('https://fremontderby.com/api/chat-reports', {
    method: 'POST', headers: { authorization: 'Bearer token' },
    body: JSON.stringify({
      messageType: 'league', messageId: 'message-1', reason: 'spam', details: 'Links',
    }),
  });
  const reportResponse = await handleReportChatMessageRequest(reportRequest, env, { fetch: reportFetch.fetch });
  assert.equal(reportResponse.status, 201);
  assert.equal(JSON.parse(reportFetch.calls[1].init.body).target_message_id, 'message-1');

  const moderateFetch = createFetch([
    { body: { id: 'admin-1' } }, { body: [{ report_id: 'report-1', status: 'resolved' }] },
  ]);
  const moderateRequest = new Request('https://fremontderby.com/api/admin/chat-reports/report-1/resolve', {
    method: 'POST', headers: { authorization: 'Bearer token' },
    body: JSON.stringify({ resolution: 'resolved', removeMessage: true }),
  });
  const moderateResponse = await handleModerateChatReportRequest(
    moderateRequest, env, 'report-1', { fetch: moderateFetch.fetch },
  );
  assert.equal(moderateResponse.status, 200);
  assert.equal(JSON.parse(moderateFetch.calls[1].init.body).remove_message, true);
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

test('direct conversation start authenticates and scopes both player and season', async () => {
  const { fetch, calls } = createFetch([
    { body: { id: 'user-1' } },
    { body: [{ conversation_id: 'conversation-1' }] },
  ]);
  const request = new Request('https://fremontderby.com/api/direct-conversations', {
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body: JSON.stringify({ seasonId: 'season-1', playerId: 'player-2' }),
  });
  const response = await handleStartDirectConversationRequest(request, env, { fetch });

  assert.equal(response.status, 201);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: 'user-1', target_season_id: 'season-1', target_player_id: 'player-2',
  });
});

test('direct message list forwards tuple cursor and message send is idempotent', async () => {
  const listFetch = createFetch([
    { body: { id: 'user-1' } },
    { body: [{ message_id: 'message-1' }] },
  ]);
  const listRequest = new Request(
    'https://fremontderby.com/api/direct-conversations/conversation-1/messages?limit=25&before=2026-08-11T00:00:00Z&beforeMessageId=message-9',
    { headers: { authorization: 'Bearer token' } },
  );
  const listResponse = await handleListDirectMessagesRequest(
    listRequest, env, 'conversation-1', { fetch: listFetch.fetch },
  );
  assert.equal(listResponse.status, 200);
  assert.equal(JSON.parse(listFetch.calls[1].init.body).before_message_id, 'message-9');

  const sendFetch = createFetch([
    { body: { id: 'user-1' } },
    { body: [{ message_id: 'message-2', body: 'Hello' }] },
  ]);
  const sendRequest = new Request(
    'https://fremontderby.com/api/direct-conversations/conversation-1/messages',
    {
      method: 'POST', headers: { authorization: 'Bearer token' },
      body: JSON.stringify({ body: ' Hello ', clientMessageId: 'client-1' }),
    },
  );
  const sendResponse = await handleSendDirectMessageRequest(
    sendRequest, env, 'conversation-1', { fetch: sendFetch.fetch },
  );
  assert.equal(sendResponse.status, 201);
  assert.equal(JSON.parse(sendFetch.calls[1].init.body).message_client_id, 'client-1');
});

test('direct message block errors are forbidden and blocking uses only the player id', async () => {
  const blockedFetch = createFetch([
    { body: { id: 'user-1' } },
    { status: 400, body: { message: 'Direct messages are blocked' } },
  ]);
  const sendRequest = new Request(
    'https://fremontderby.com/api/direct-conversations/conversation-1/messages',
    {
      method: 'POST', headers: { authorization: 'Bearer token' },
      body: JSON.stringify({ body: 'Hello' }),
    },
  );
  const blockedResponse = await handleSendDirectMessageRequest(
    sendRequest, env, 'conversation-1', { fetch: blockedFetch.fetch },
  );
  assert.equal(blockedResponse.status, 403);

  const blockFetch = createFetch([
    { body: { id: 'user-1' } },
    { body: [{ blocked_player_id: 'player-2' }] },
  ]);
  const blockRequest = new Request('https://fremontderby.com/api/players/player-2/block', {
    method: 'POST', headers: { authorization: 'Bearer token' },
  });
  const blockResponse = await handleBlockPlayerChatRequest(
    blockRequest, env, 'player-2', { fetch: blockFetch.fetch },
  );
  assert.equal(blockResponse.status, 201);
  assert.deepEqual(JSON.parse(blockFetch.calls[1].init.body), {
    actor_user_id: 'user-1', target_player_id: 'player-2',
  });
});
