import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('moderation empty has recovery links', () => {
  const src = readFileSync(new URL('../src/chatModerationPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderChatModerationPage/);
  assert.match(src, /href="\/messages"/);
});
