import assert from 'node:assert/strict';
import test from 'node:test';
import { enhanceProfileContact } from '../src/profileContactEnhancer.js';

test('profile enhancer injects next match even without the contact card hook', async () => {
  const source = '<html><head></head><body><header></header></body></html>';
  const response = await enhanceProfileContact(new Response(source, { headers: { 'content-type': 'text/html' } }));
  const html = await response.text();
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});

test('profile enhancer still injects the private contact card', async () => {
  const source = '<html><head></head><body><header></header><section class="stack" data-authenticated-content hidden></section></body></html>';
  const response = await enhanceProfileContact(new Response(source, { headers: { 'content-type': 'text/html' } }));
  const html = await response.text();
  assert.match(html, /data-profile-contact/);
  assert.match(html, /data-next-match/);
});
