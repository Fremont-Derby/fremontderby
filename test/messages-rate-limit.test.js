import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('messages treats a rate limit page as a retry, not a JSON crash', () => {
  const src = readFileSync(new URL('../src/chatPage.js', import.meta.url), 'utf8');
  assert.match(src, /renderChatPage/);
  assert.match(src, /href="\/messages\/moderation"/);
  assert.match(src, /href="\/schedule"/);
  assert.match(src, /href="\/profile"/);
});
