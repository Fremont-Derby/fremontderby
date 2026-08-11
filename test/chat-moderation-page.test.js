import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChatModerationPage } from '../src/chatModerationPage.js';

test('moderation page is mobile-first and uses authenticated report APIs', () => {
  const html = renderChatModerationPage({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  });
  assert.match(html, /Chat moderation · Fremont Derby/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/admin\/chat-reports\?limit=100/);
  assert.match(html, /\/api\/admin\/chat-reports\/'\+encodeURIComponent\(reportId\)\+'\/resolve/);
  assert.match(html, /Remove message/);
  assert.match(html, /Report dismissed/);
  assert.match(html, /@media\(max-width:700px\)/);
  assert.doesNotMatch(html, /Access token/i);
});
