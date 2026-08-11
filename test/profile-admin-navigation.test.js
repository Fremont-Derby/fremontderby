import test from 'node:test';
import assert from 'node:assert/strict';

import { renderProfilePage } from '../src/profilePage.js';

test('Profile exposes an admin tool group only after existing admin authorization succeeds', () => {
  const html = renderProfilePage({});

  assert.match(html, /data-admin-tools hidden/);
  assert.match(html, /aria-label="League admin tools"/);
  assert.match(html, /href="\/admin\/operations"[^>]*>Operations<\/a>/);
  assert.match(html, /href="\/season-setup"[^>]*>Season setup<\/a>/);
  assert.match(html, /href="\/messages\/moderation"[^>]*>Moderation<\/a>/);
  assert.match(html, /fetch\('\/api\/admin\/operations'/);
  assert.match(html, /adminTools\.hidden = response\.status !== 200/);
});

test('Profile admin actions stay touch-friendly and keyboard-visible', () => {
  const html = renderProfilePage({});

  assert.match(html, /\.admin-actions a \{ min-height: 48px/);
  assert.match(html, /a:focus-visible/);
  assert.match(html, /@media \(max-width: 820px\)[\s\S]*\.admin-actions \{ grid-template-columns: 1fr; \}/);
});
