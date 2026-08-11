import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260811023000_direct_messaging_and_blocks.sql',
  'utf8',
);

test('direct messaging and blocks are private Worker-owned data', () => {
  for (const table of [
    'direct_conversations',
    'direct_messages',
    'direct_chat_reads',
    'player_chat_blocks',
  ]) {
    assert.match(sql, new RegExp(`create table public\\.${table}`, 'i'));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`on public\\.${table} for all to anon, authenticated[\\s\\S]*using \\(false\\) with check \\(false\\)`, 'i'));
  }
  assert.doesNotMatch(sql, /security definer/i);
});

test('direct conversations require two active-season participants', () => {
  assert.match(sql, /private\.is_active_season_participant\(actor_player\.id, target_season_id\)/i);
  assert.match(sql, /private\.is_active_season_participant\(target_player\.id, target_season_id\)/i);
  assert.match(sql, /s\.status in \('registration', 'active', 'playoffs'\)/i);
  assert.match(sql, /sp\.status = 'active'/i);
  assert.match(sql, /tm\.ends_at is null/i);
});

test('blocking stops both directions without changing league visibility', () => {
  assert.match(sql, /block\.blocker_player_id = actor_player\.id[\s\S]*block\.blocked_player_id = target_player\.id/i);
  assert.match(sql, /block\.blocker_player_id = target_player\.id[\s\S]*block\.blocked_player_id = actor_player\.id/i);
  assert.match(sql, /Direct messages are blocked/i);
  assert.doesNotMatch(sql, /delete from public\.(?:players|team_memberships|team_matches)/i);
});

test('direct messages use idempotency and cursor pagination', () => {
  assert.match(sql, /unique \(author_player_id, client_message_id\)/i);
  assert.match(sql, /on conflict \(author_player_id, client_message_id\)/i);
  assert.match(sql, /\(message\.created_at, message\.id\) < \(/i);
  assert.doesNotMatch(sql, /\boffset\b/i);
});

test('all direct messaging RPCs are service-role only', () => {
  for (const name of [
    'list_direct_message_candidates',
    'get_my_direct_message_inbox',
    'start_direct_conversation',
    'list_direct_messages',
    'send_direct_message',
    'mark_direct_chat_read',
    'block_player_chat',
    'unblock_player_chat',
    'list_blocked_chat_players',
  ]) {
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\([\\s\\S]*?to service_role;`, 'i'));
  }
});
