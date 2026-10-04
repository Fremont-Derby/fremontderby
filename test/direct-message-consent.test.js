import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { routeDirectMessageConsent } from '../src/directMessageConsentHttp.js';
import { handleSendDirectMessageRequest } from '../src/chatHttp.js';

const env = { ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-public', SUPABASE_SERVICE_ROLE_KEY: 'test-service' };
const request = (method = 'GET', body, token = 'test-token') => new Request('https://jfl.test/api/me/direct-message-consent', {
  method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
function mock(result = false, status = 200) {
  const calls = [];
  return { calls, fetch: async (url, init) => {
    calls.push({ url, init });
    return Response.json(calls.length === 1 ? { id: 'authenticated-user' } : result,
      { status: calls.length === 1 ? 200 : status });
  } };
}
test('default OFF and explicit ON/OFF use authenticated actor and JFL RPC profile', async () => {
  for (const enabled of [false, true]) {
    const fixture = mock(enabled);
    const response = await routeDirectMessageConsent(request('PUT', { directMessages: enabled }), env, fixture);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { directMessages: enabled });
    assert.deepEqual(JSON.parse(fixture.calls[1].init.body), { actor_user_id: 'authenticated-user', enabled });
    assert.equal(fixture.calls[1].init.headers['content-profile'], 'jfl');
    assert.ok(fixture.calls[1].url.endsWith('/set_direct_message_consent'));
  }
  const fixture = mock();
  assert.deepEqual(await (await routeDirectMessageConsent(request(), env, fixture)).json(), { directMessages: false });
});
test('invalid or spoofed settings never reach persistence', async () => {
  for (const input of [null, [], {}, { directMessages: 'false' }, { directMessages: 1 },
    { directMessages: true, actor_user_id: 'victim' }]) {
    const fixture = mock();
    assert.equal((await routeDirectMessageConsent(request('PUT', input), env, fixture)).status, 400);
    assert.equal(fixture.calls.length, 1);
  }
});
test('consent API fails closed for unavailable/malformed persistence and other lanes', async () => {
  for (const [result, status] of [[{ secret: 'private database detail' }, 500], [null, 200], [[], 200]]) {
    const fixture = mock(result, status);
    const response = await routeDirectMessageConsent(request(), env, fixture);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'Messaging settings unavailable' });
  }
  for (const lane of ['dru', 'gamma', 'production']) {
    const fixture = mock();
    assert.equal((await routeDirectMessageConsent(request(), { ...env, ENVIRONMENT: lane }, fixture)).status, 404);
    assert.equal(fixture.calls.length, 0);
  }
  assert.equal((await routeDirectMessageConsent(request('DELETE'), env, mock())).status, 405);
  const rejected = await routeDirectMessageConsent(request(), env, { fetch: async () => Response.json({}, { status: 401 }) });
  assert.equal(rejected.status, 401);
});
test('old-thread send denial is an authorization failure with no consent detail', async () => {
  const fixture = mock({ message: 'Direct messaging unavailable' }, 403);
  const response = await handleSendDirectMessageRequest(new Request('https://jfl.test/api/direct-conversations/old/messages', {
    method: 'POST', headers: { authorization: 'Bearer test-token' }, body: JSON.stringify({ body: 'Stale client draft' }),
  }), env, 'old', fixture);
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /Direct messaging unavailable/);
});
test('JFL migration gates direct writes and opt-out under the same transaction locks', () => {
  const sql = readFileSync('supabase/migrations/20261004220514_jfl_direct_message_consent.sql', 'utf8');
  assert.match(sql, /enabled boolean not null default false/);
  assert.match(sql, /alter table jfl.direct_message_consent enable row level security/);
  assert.match(sql, /revoke all on jfl.direct_message_consent from public, anon, authenticated/);
  assert.match(sql, /least\(user_a,user_b\)[\s\S]*greatest\(user_a,user_b\)/);
  assert.match(sql, /where user_id=target_user_id for update/);
  assert.match(sql, /direct_conversation_consent before insert or update/);
  assert.match(sql, /direct_message_consent before insert or update of conversation_id,author_player_id,body,client_message_id/);
  assert.match(sql, /if not jfl_private.lock_direct_message_consent\(reader_user_id\) then return null/);
  assert.doesNotMatch(sql, /(?:create|alter|update|insert into|delete from)\s+(?:public|dru|gamma|auth)\./i);
});
