import assert from 'node:assert/strict';
import test from 'node:test';
import { routeAdminGateway } from '../src/adminGatewayRouter.js';

test('admin gateway serves HTML only on GET /admin', async () => {
  const ok = routeAdminGateway(new Request('https://example.test/admin'));
  assert.ok(ok);
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get('content-type'), /text\/html/);
  const html = await ok.text();
  assert.match(html, /Admin/i);
  assert.match(html, /Players|Seasons/i);
});

test('admin gateway rejects non-GET and ignores other paths', async () => {
  const post = routeAdminGateway(new Request('https://example.test/admin', { method: 'POST' }));
  assert.equal(post.status, 405);
  assert.equal(routeAdminGateway(new Request('https://example.test/admin/players')), null);
  assert.equal(routeAdminGateway(new Request('https://example.test/')), null);
});
