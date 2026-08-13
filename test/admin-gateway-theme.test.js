import assert from 'node:assert/strict';
import test from 'node:test';

import { adminGatewayThemeStyles, injectAdminGatewayTheme } from '../src/adminGatewayTheme.js';
import routerEntry from '../src/routerEntry.js';

test('Admin gateway theme replaces legacy dark content with shared light tokens', () => {
  assert.match(adminGatewayThemeStyles, /main\.app:has\(\[data-admin-content\]\)/);
  assert.match(adminGatewayThemeStyles, /color-scheme: light/);
  assert.match(adminGatewayThemeStyles, /\.state,[\s\S]*--fd-bg-surface/);
  assert.match(adminGatewayThemeStyles, /\.action\.secondary[\s\S]*--fd-border-control/);
  assert.match(adminGatewayThemeStyles, /forced-colors: active/);
});

test('Admin gateway theme injects only once on matching HTML', async () => {
  const admin = '<!doctype html><html><head></head><body><main class="app"><section data-admin-content></section></main></body></html>';
  const first = await injectAdminGatewayTheme(new Response(admin, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const firstHtml = await first.text();
  assert.equal((firstHtml.match(/data-fd-admin-gateway-theme/g) || []).length, 1);

  const second = await injectAdminGatewayTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.equal(((await second.text()).match(/data-fd-admin-gateway-theme/g) || []).length, 1);
});

test('runtime Admin gateway receives the convergence layer', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/admin'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-admin-gateway-theme/);
  assert.match(html, /data-fd-design-system/);
  assert.match(html, /data-fd-accessibility-layer/);
});
