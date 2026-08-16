import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('moderation empty has recovery links', () => {
  const src = readFileSync(new URL('../src/chatModerationPage.js', import.meta.url), 'utf8');
  assert.match(src, /No chat reports to review/);
  assert.match(src, /\/admin\/audit/);
});

test('app shell links notifications', () => {
  const src = readFileSync(new URL('../src/appShell.js', import.meta.url), 'utf8');
  assert.match(src, /\/notifications/);
});
