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
  assert.match(html, /\.layout \{ height: min\(720px, calc\(100vh - 160px\)\)/);
  assert.match(html, /max-height: calc\(100vh - 160px\)/);
  assert.match(html, /\.message-list \{ min-height: 0; overflow-y: auto/);
  assert.match(html, /touch-action: pan-y/);
  assert.match(html, /data-composer/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/chat-threads/);
  assert.match(html, /\/api\/me\/direct-message-inbox/);
  assert.match(html, /\/api\/me\/direct-message-candidates/);
  assert.match(html, /\/api\/me\/league-chat-threads/);
  assert.match(html, /\/api\/me\/matchup-chat-threads/);
  assert.match(html, /\/api\/teams\//);
  assert.match(html, /\/api\/direct-conversations\//);
  assert.match(html, /messagePath\(thread, '\/read'\)/);
  assert.match(html, /\/api\/players\//);
  assert.match(html, /\/block/);
  assert.match(html, /\/api\/seasons\//);
  assert.match(html, /\/api\/team-matches\//);
  assert.match(html, /\/api\/chat-reports/);
  assert.match(html, /data-report-dialog/);
  assert.match(html, /data-load-older/);
  assert.match(html, /beforeMessageId/);
  assert.match(html, /refreshThreadMetadata/);
  assert.match(html, /fd:messages-read/);
  assert.match(html, /\/messages\/moderation/);
  assert.match(html, /detectModerator/);
  assert.match(html, /No other registered players are available to message yet/);
  assert.match(html, /setInterval[\s\S]*4000/);
  assert.match(html, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(html, /Access token/i);
});
