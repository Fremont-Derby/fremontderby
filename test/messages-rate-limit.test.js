import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('messages treats a rate limit page as a retry, not a JSON crash', () => {
  const html = readFileSync(new URL('../src/chatPage.js', import.meta.url), 'utf8');
  assert.match(html, /Too many requests\. Wait a few seconds and try again/);
  assert.match(html, /The page returned HTML instead of message data/);
});
