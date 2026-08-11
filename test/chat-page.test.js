import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChatPage } from '../src/chatPage.js';

test('messages page is mobile-first and uses the existing Google session', () => {
  const html = renderChatPage({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  });

  assert.match(html, /Messages · Fremont Derby/);
  assert.match(html, /data-thread-select/);
  assert.match(html, /data-message-list/);
  assert.match(html, /data-composer/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/chat-threads/);
  assert.match(html, /\/api\/teams\//);
  assert.match(html, /messages\/read/);
  assert.match(html, /setInterval[\s\S]*4000/);
  assert.match(html, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(html, /Access token/i);
});
