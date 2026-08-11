import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/20260811040000_matchup_chat_threads.sql', 'utf8');

test('matchup messages and reads are private and service-role owned', () => {
  for (const table of ['matchup_chat_messages', 'matchup_chat_reads']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`on public\\.${table} for all to anon, authenticated[\\s\\S]*using \\(false\\) with check \\(false\\)`, 'i'));
  }
});

test('matchup history follows membership windows and completed threads are read-only', () => {
  assert.match(sql, /membership\.starts_at <= message\.created_at/);
  assert.match(sql, /message\.created_at < membership\.ends_at/);
  assert.match(sql, /Current matchup team membership is required/);
  assert.match(sql, /Completed matchup chats are read-only/);
  assert.match(sql, /on conflict \(author_player_id, client_message_id\)/);
});

test('matchup messages participate in reporting and moderation', () => {
  assert.match(sql, /add column matchup_message_id/);
  assert.match(sql, /target_type in \('team', 'direct', 'league', 'matchup'\)/);
  assert.match(sql, /update public\.matchup_chat_messages set removed_at/);
  assert.match(sql, /chat_message_reports_matchup_reporter_idx/);
});

test('matchup chat RPCs are service-role only', () => {
  for (const name of [
    'get_my_matchup_chat_inbox', 'list_matchup_chat_messages',
    'send_matchup_chat_message', 'mark_matchup_chat_read',
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}\\(`, 'i'));
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\(`, 'i'));
  }
});
