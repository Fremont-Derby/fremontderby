import assert from 'node:assert/strict';
import test from 'node:test';
import { createJflNotificationsRoute } from '../src/jflNotificationsHttp.js';
import { renderJflNotificationsPage } from '../src/jflNotificationsPage.js';

const env = {
  ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only', SUPABASE_SCHEMA: 'jfl',
};
const request = (path, method = 'GET') => new Request(`https://jfl.example${path}`, { method });

test('JFL notices page is real, responsive and never links to retired Trades', async () => {
  const route = createJflNotificationsRoute();
  const response = await route(request('/notifications'), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Your notices/);
  assert.match(html, /data-mark-all/);
  assert.match(html, /Unread/);
  assert.match(html, /@media\(max-width:600px\)/);
  assert.doesNotMatch(html, /href="\/trades"/);
  assert.doesNotMatch(html, /api\/admin\/notifications/);
  assert.equal(await route(request('/notifications', 'POST'), env).then(r => r.status), 405);
  assert.equal(await route(request('/notifications'), { ENVIRONMENT: 'production' }), null);
});

test('notices API uses authenticated actor only and JFL schema', async () => {
  const calls = [];
  const route = createJflNotificationsRoute({
    authenticate: async () => ({ id: 'actor-a' }),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json([{ id: 'notice-a', title: 'Ready', body: 'Tonight', read_at: null, created_at: '2026-10-01T00:00:00Z' }]);
    },
  });
  const response = await route(request('/api/me/notifications'), env);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).notifications.map(n => n.id), ['notice-a']);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/rest\/v1\/rpc\/list_my_notifications$/);
  assert.equal(JSON.parse(calls[0].options.body).actor_user_id, 'actor-a');
  assert.equal(calls[0].options.headers['accept-profile'], 'jfl');
  assert.equal(calls[0].options.headers['content-profile'], 'jfl');
});

test('read actions are scoped to actor; unauthorized request does not touch store', async () => {
  const calls = [];
  const authorized = createJflNotificationsRoute({
    authenticate: async () => ({ id: 'actor-b' }),
    fetchImpl: async (url, options) => { calls.push({ url, options }); return Response.json({ id: 'notice-b', read_at: '2026-10-02T00:00:00Z' }); },
  });
  assert.equal((await authorized(request('/api/me/notifications/notice-b/read', 'POST'), env)).status, 200);
  assert.equal(JSON.parse(calls[0].options.body).actor_user_id, 'actor-b');
  assert.equal(JSON.parse(calls[0].options.body).target_notification_id, 'notice-b');
  assert.equal((await authorized(request('/api/me/notifications/read-all', 'POST'), env)).status, 200);
  assert.match(calls[1].url, /mark_all_my_notifications_read$/);
  const denied = createJflNotificationsRoute({
    authenticate: async () => { throw new Error('denied'); },
    fetchImpl: async () => { throw new Error('store must not be called'); },
  });
  assert.equal((await denied(request('/api/me/notifications'), env)).status, 502);
  assert.equal((await authorized(request('/api/me/notifications/read-all'), env)).status, 405);
  assert.equal(await authorized(request('/api/me/notifications'), { ENVIRONMENT: 'production' }), null);
});

test('client script parses without injecting notice text into HTML', () => {
  const html = renderJflNotificationsPage();
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /title\.textContent=item\.title/);
  assert.match(script, /body\.textContent=item\.body/);
  assert.match(script, /safeHref\(item\.href\)/);
});
