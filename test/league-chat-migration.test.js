import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260811030000_league_chat_and_moderation.sql',
  'utf8',
);
const idempotencySql = fs.readFileSync(
  'supabase/migrations/20260811031500_league_chat_idempotency_constraint.sql',
  'utf8',
);

test('league room and reports are private Worker-owned data', () => {
  for (const table of ['league_chat_messages', 'league_chat_reads', 'chat_message_reports']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`on public\\.${table} for all to anon, authenticated[\\s\\S]*using \\(false\\) with check \\(false\\)`, 'i'));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, 'i'));
  }
});

test('league room preserves history but only active participants may send', () => {
  assert.match(sql, /private\.is_season_chat_participant/);
  assert.match(sql, /private\.is_active_season_participant\(actor_player\.id, target_season_id\)/);
  assert.match(sql, /Active season participation is required to post league messages/);
  assert.match(sql, /on conflict \(author_player_id, client_message_id\)/);
  assert.match(idempotencySql, /unique \(author_player_id, client_message_id\)/);
  assert.match(sql, /\(message\.created_at, message\.id\) </);
});

test('reports validate message access and moderation requires a league admin', () => {
  assert.match(sql, /create or replace function public\.report_chat_message/);
  assert.match(sql, /membership\.starts_at <= message\.created_at/);
  assert.match(sql, /actor_player_id in \(conversation\.player_low_id, conversation\.player_high_id\)/);
  assert.match(sql, /Cannot report your own message/);
  assert.match(sql, /private\.league_admins/);
  assert.match(sql, /update public\.team_chat_messages set removed_at/);
  assert.match(sql, /update public\.direct_messages set removed_at/);
  assert.match(sql, /update public\.league_chat_messages set removed_at/);
});

test('all league and moderation RPCs are service-role only', () => {
  for (const name of [
    'get_my_league_chat_inbox', 'list_league_chat_messages',
    'send_league_chat_message', 'mark_league_chat_read', 'report_chat_message',
    'list_chat_message_reports', 'moderate_chat_message_report',
  ]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}\\(`, 'i'));
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\(`, 'i'));
  }
});
