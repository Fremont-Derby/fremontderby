import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleListMatchupChatThreadsRequest, handleSendMatchupMessageRequest,
  handleMarkMatchupChatReadRequest, handleListMatchupMessagesRequest,
  handleMessageNotificationSummaryRequest } from '../src/chatHttp.js';

const env = { ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'server-test' };
const request = (method = 'GET', body, authenticated = true) => new Request('https://jfl.test/api/team-matches/legacy/messages',
  { method, headers: authenticated ? { authorization: 'Bearer synthetic-token' } : {},
    ...(body === undefined ? {} : { body }) });
function fixture(result = []) {
  const calls = [];
  return { calls, fetch: async (url, init) => {
    calls.push({ url, init });
    return Response.json(calls.length === 1 ? { id: 'synthetic-actor' } : result);
  } };
}
for (const handler of [handleSendMatchupMessageRequest, handleMarkMatchupChatReadRequest]) {
  test(handler.name + ': stale and malformed clients retire before RPC or body processing', async () => {
    for (const body of ['{"body":"Stale draft"}', '{', '{"actor_user_id":"victim"}']) {
      const f = fixture();
      const response = await handler(request('POST', body), env, 'legacy', f);
      assert.equal(response.status, 410);
      assert.match((await response.json()).error, /Matchup chat is retired/);
      assert.equal(f.calls.length, 1);
      assert.match(f.calls[0].url, /auth\/v1\/user$/);
    }
  });
  test(handler.name + ': authentication still precedes retirement', async () => {
    const f = fixture();
    assert.equal((await handler(request('POST', '{}', false), env, 'legacy', f)).status, 401);
    assert.equal(f.calls.length, 0);
    const rejected = await handler(request('POST', '{}'), env, 'legacy',
      { fetch: async () => Response.json({}, { status: 401 }) });
    assert.equal(rejected.status, 401);
  });
}
test('retired discovery is empty and notifications never request its RPC', async () => {
  const f = fixture([{ unread_count: 1 }]);
  assert.deepEqual(await (await handleListMatchupChatThreadsRequest(request(), env, f)).json(), { threads: [] });
  assert.equal(f.calls.length, 1);
  const notifications = fixture([{ unread_count: 1 }]);
  const response = await handleMessageNotificationSummaryRequest(request(), env, notifications);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).unreadCount, 3);
  assert.equal(notifications.calls.length, 4);
  assert.equal(notifications.calls.some(call => call.url.includes('matchup')), false);
});
test('retained history still uses authenticated membership RPC; other lanes keep existing sends', async () => {
  const f = fixture([{ message_id: 'historical', body: 'Synthetic retained history' }]);
  const response = await handleListMatchupMessagesRequest(request(), env, 'legacy', f);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).messages[0].message_id, 'historical');
  assert.match(f.calls[1].url, /list_matchup_chat_messages$/);
  assert.equal(JSON.parse(f.calls[1].init.body).actor_user_id, 'synthetic-actor');
  for (const lane of ['dru', 'gamma', 'production']) {
    const other = fixture([{ message_id: 'synthetic' }]);
    assert.equal((await handleSendMatchupMessageRequest(request('POST', '{"body":"Lane-isolation check"}'),
      { ...env, ENVIRONMENT: lane }, 'legacy', other)).status, 201);
    assert.match(other.calls[1].url, /send_matchup_chat_message$/);
  }
});
test('JFL schedule cannot emit a matchup chat action while preserving score actions', () => {
  const source = readFileSync('src/jflModernSchedule.js', 'utf8');
  assert.doesNotMatch(source, /messages\?matchup/);
  assert.match(source, /scorecard\?match/);
});
