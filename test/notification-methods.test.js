import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('notification read accepts PUT and PATCH', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /handleMarkNotificationReadRequest[\s\S]*?PATCH/);
  assert.match(src, /handleMarkAllNotificationsReadRequest[\s\S]*?PATCH/);
  assert.match(src, /free_agent\.register/);
});
