import test from 'node:test';
import assert from 'node:assert/strict';
import { routeSocialChatConsent } from '../src/socialChatConsentHttp.js';
import { handleSendTeamMessageRequest, handleSendLeagueMessageRequest } from '../src/chatHttp.js';

const env = { ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'server-test' };
const req = (channel, method = 'GET', body) => new Request('https://jfl.test/api/me/social-chat-consent/' + channel,
  { method, headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
function mock(result = false, status = 200) {
  const calls = [];
  return { calls, fetch: async (url, init) => {
    calls.push({ url, init });
    return Response.json(calls.length === 1 ? { id: 'actor' } : result,
      { status: calls.length === 1 ? 200 : status });
  } };
}
for (const channel of ['general', 'team']) {
  test(channel + ': default OFF and explicit booleans use authenticated actor only', async () => {
    const fixture = mock();
    assert.deepEqual(await (await routeSocialChatConsent(req(channel), env, fixture)).json(), { channel, enabled: false });
    for (const enabled of [true, false]) {
      const f = mock(enabled);
      const response = await routeSocialChatConsent(req(channel, 'PUT', { enabled }), env, f);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { channel, enabled });
      assert.deepEqual(JSON.parse(f.calls[1].init.body), { actor_user_id: 'actor', channel, enabled });
      assert.equal(f.calls[1].init.headers['content-profile'], 'jfl');
    }
  });
  test(channel + ': malformed/spoofed writes never persist', async () => {
    for (const input of [null, [], {}, { enabled: 'false' }, { enabled: 1 }, { enabled: true, channel: 'direct' },
      { enabled: true, actor_user_id: 'victim' }]) {
      const f = mock();
      assert.equal((await routeSocialChatConsent(req(channel, 'PUT', input), env, f)).status, 400);
      assert.equal(f.calls.length, 1);
    }
  });
  test(channel + ': failed or malformed persistence fails closed without database detail', async () => {
    for (const [data, status] of [[null, 200], [{ secret: 'private' }, 500], [[], 200]]) {
      const response = await routeSocialChatConsent(req(channel), env, mock(data, status));
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'Messaging settings unavailable' });
    }
    for (const lane of ['dru', 'gamma', 'production']) {
      const f = mock();
      assert.equal((await routeSocialChatConsent(req(channel), { ...env, ENVIRONMENT: lane }, f)).status, 404);
      assert.equal(f.calls.length, 0);
    }
    assert.equal((await routeSocialChatConsent(req(channel, 'DELETE'), env, mock())).status, 405);
    assert.equal((await routeSocialChatConsent(req(channel), env, { fetch: async () => Response.json({}, { status: 401 }) })).status, 401);
  });
}
test('channel cannot select DM or an unknown consent capability', async () => {
  assert.equal(await routeSocialChatConsent(req('direct'), env, mock()), null);
});
test('stale Team/General sends map database denial to 403 without exposing preferences', async () => {
  for (const handler of [handleSendTeamMessageRequest, handleSendLeagueMessageRequest]) {
    const request = new Request('https://jfl.test/api/messages', { method: 'POST',
      headers: { authorization: 'Bearer test-token' }, body: JSON.stringify({ body: 'Stale client draft' }) });
    const response = await handler(request, env, 'synthetic-room', mock({ message: 'Social chat unavailable' }, 403));
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /Social chat unavailable$/);
  }
});
