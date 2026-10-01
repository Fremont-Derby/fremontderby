import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('chat renderMessages uses fdStableList', () => {
  const src = readFileSync(new URL('../src/chatPage.js', import.meta.url), 'utf8');
  assert.match(src, /function buildMessageArticle/);
  assert.match(src, /fdStableList\(messageListEl/);
});
