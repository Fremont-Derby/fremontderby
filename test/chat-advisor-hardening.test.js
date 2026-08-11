import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260811011500_team_chat_advisor_hardening.sql',
  'utf8',
);

test('chat tables use explicit deny policies for untrusted browser roles', () => {
  for (const table of ['team_chat_messages', 'team_chat_reads']) {
    assert.match(
      sql,
      new RegExp(`on public\\.${table}[\\s\\S]*for all[\\s\\S]*to anon, authenticated[\\s\\S]*using \\(false\\)[\\s\\S]*with check \\(false\\)`, 'i'),
    );
  }
});

test('chat foreign keys have supporting indexes', () => {
  assert.match(sql, /team_chat_messages \(author_player_id\)/i);
  assert.match(sql, /team_chat_messages \(season_id, team_id\)/i);
  assert.match(sql, /team_chat_messages \(team_id, season_id\)/i);
  assert.match(sql, /team_chat_messages \(removed_by\)/i);
  assert.match(sql, /team_chat_reads \(player_id\)/i);
  assert.match(sql, /team_chat_reads \(season_id, team_id\)/i);
  assert.match(sql, /team_chat_reads \(team_id, season_id\)/i);
});
