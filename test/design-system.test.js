import assert from 'node:assert/strict';
import test from 'node:test';

import { designSystemStyles, injectDesignSystem } from '../src/designSystem.js';
import routerEntry from '../src/routerEntry.js';

test('shared design system codifies the approved scoring mock-up visual language', () => {
  assert.match(designSystemStyles, /--fd-page: #f3f1ed/);
  assert.match(designSystemStyles, /--fd-surface: #ffffff/);
  assert.match(designSystemStyles, /--fd-green-800: #096238/);
  assert.match(designSystemStyles, /--fd-wood: #8a4b25/);
  assert.match(designSystemStyles, /\.fd-shell[\s\S]*border-bottom: 4px solid var\(--fd-wood\)/);
  assert.match(designSystemStyles, /\.rack-head\[data-state="mismatch"\]/);
  assert.match(designSystemStyles, /\.opening-option\[aria-pressed="true"\]/);
  assert.match(designSystemStyles, /\.add-rack/);
  assert.match(designSystemStyles, /overflow-x: hidden/);
});

test('design system is injected after page-local CSS and only into HTML', async () => {
  const response = new Response('<!doctype html><html><head><style>body{background:#000}</style></head><body>ok</body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const designed = await injectDesignSystem(response);
  const html = await designed.text();
  assert.match(html, /body\{background:#000\}[\s\S]*data-fd-design-system/);

  const json = new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
  const untouched = await injectDesignSystem(json);
  assert.equal(await untouched.text(), '{"ok":true}');
});

test('canonical browser pipeline applies the same design system to public and Test Drive pages', async () => {
  for (const path of ['/', '/demo']) {
    const response = await routerEntry.fetch(new Request(`https://example.test${path}`), {}, {});
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /data-fd-design-system/);
    assert.match(html, /data-fd-shell/);
  }
});
