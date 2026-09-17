import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChatPage } from '../src/chatPage.js';

test('messages composer send payload pins the open thread', () => {
  const html = renderChatPage({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  });
  assert.match(html, /expectedThreadId: thread\.id/);
  assert.match(html, /expectedConversationId/);
  assert.match(html, /expectedTeamId/);
  assert.match(html, /expectedSeasonId/);
  assert.match(html, /expectedTeamMatchId/);
});
