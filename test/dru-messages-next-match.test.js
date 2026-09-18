import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceDruNextMatch } from '../src/druNextMatchEnhance.js';

test('messages enhancer injects next-match hook', async () => {
  const source = '<html><head></head><body><header></header><main data-chat-layout></main></body></html>';
  const response = await enhanceDruNextMatch(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    '/messages',
  );
  const html = await response.text();
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});

test('messages enhancer is a no-op on other paths', async () => {
  const source = '<html><body><header></header></body></html>';
  const response = await enhanceDruNextMatch(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    '/teams',
  );
  const html = await response.text();
  assert.doesNotMatch(html, /data-next-match/);
});
