import assert from 'node:assert/strict';
import test from 'node:test';

import { adminSurfaceThemeStyles, injectAdminSurfaceTheme } from '../src/adminSurfaceTheme.js';
import routerEntry from '../src/routerEntry.js';

test('remaining admin surface theme uses the shared light contract', () => {
  assert.match(adminSurfaceThemeStyles, /body\[data-fd-admin-surface\][\s\S]*color-scheme: light/);
  assert.match(adminSurfaceThemeStyles, /input,[\s\S]*--fd-bg-surface/);
  assert.match(adminSurfaceThemeStyles, /\.panel,[\s\S]*--fd-shadow-soft/);
  assert.match(adminSurfaceThemeStyles, /\.status\[data-tone="critical"\][\s\S]*--fd-danger-bg/);
  assert.match(adminSurfaceThemeStyles, /\.tab\[aria-pressed="true"\][\s\S]*--fd-accent/);
  assert.match(adminSurfaceThemeStyles, /prefers-reduced-motion: reduce/);
  assert.match(adminSurfaceThemeStyles, /forced-colors: active/);
});

test('admin theme is pathname scoped and only injected once', async () => {
  const source = '<!doctype html><html><head></head><body><main>Admin</main></body></html>';
  const first = await injectAdminSurfaceTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/admin/players');
  const firstHtml = await first.text();
  assert.match(firstHtml, /data-fd-admin-surface="players"/);
  assert.equal((firstHtml.match(/data-fd-admin-surface-theme/g) || []).length, 1);

  const second = await injectAdminSurfaceTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/admin/players');
  assert.equal(((await second.text()).match(/data-fd-admin-surface-theme/g) || []).length, 1);

  const unrelated = await injectAdminSurfaceTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/teams');
  assert.doesNotMatch(await unrelated.text(), /data-fd-admin-surface-theme/);
});

test('runtime remaining admin pages receive the light convergence layer', async () => {
  for (const path of ['/admin/players', '/admin/season-teams', '/admin/operations', '/season-setup']) {
    const response = await routerEntry.fetch(new Request(`https://example.test${path}`), {}, {});
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /data-fd-admin-surface-theme/, path);
    assert.match(html, /data-fd-design-system/, path);
    assert.match(html, /data-fd-accessibility-layer/, path);
  }
});
