import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('notifications page signals badge refresh after read-all', () => {
  const src = readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(src, /fd:notifications-changed/);
});

test('appShell listens for notification and message change events', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(src, /fd:notifications-changed/);
  assert.match(src, /fd:messages-changed/);
});

test('chat markRead signals message badge refresh', () => {
  const src = readFileSync(new URL('../src/chatPage.js', import.meta.url), 'utf8');
  assert.match(src, /fd:messages-changed/);
});
