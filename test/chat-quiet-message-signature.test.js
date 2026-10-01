import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('chat renderMessages short-circuits on signature', () => {
  const src = readFileSync(new URL('../src/chatPage.js', import.meta.url), 'utf8');
  assert.match(src, /messagesSignature/);
  assert.match(src, /lastMessagesSignature/);
  assert.match(src, /force: true/);
});
