import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260811042000_postseason_lineups_and_anchor_tiebreakers.sql',
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

test('postseason lineups use four slots and persist a locked anchor', async () => {
  const sql = await migrationSql();
  assert.match(sql, /slot_number between 1 and 4/i);
  assert.match(sql, /anchor_player_id uuid references public\.players/i);
  assert.match(sql, /create or replace function public\.submit_postseason_lineup/i);
  assert.match(sql, /Postseason lineup and anchor are locked after submission/i);
  assert.match(sql, /Postseason anchor must be selected from the submitted lineup/i);
  assert.match(sql, /qualifying_four_count < 3 or qualifying_three_count < 4/i);
});

test('regular lineups remain three-player while postseason generation uses four', async () => {
  const sql = await migrationSql();
  assert.match(sql, /expected_slots := case when target_round\.stage = 'regular' then 3 else 4 end/i);
  assert.match(sql, /if target_round\.stage = 'tiebreaker' then return/i);
});

test('a two-two postseason score creates one linked anchor tiebreaker', async () => {
  const sql = await migrationSql();
  assert.match(sql, /create table if not exists private\.postseason_anchor_tiebreakers/i);
  assert.match(sql, /parent_team_match_id uuid not null unique/i);
  assert.match(sql, /values \(tm\.season_id, next_tb_round, 'tiebreaker', 'in_progress'\)/i);
  assert.match(sql, /anchor_a, anchor_b, 'scheduled'/i);
  assert.match(sql, /refresh_postseason_team_match_after_player_match/i);
});

test('anchor result resolves the parent matchup and championship completes the season', async () => {
  const sql = await migrationSql();
  assert.match(sql, /where id = link\.parent_team_match_id/i);
  assert.match(sql, /update public\.seasons set status = 'complete'/i);
  assert.match(sql, /Both semifinals must be finalized, including any required anchor tiebreaker/i);
  assert.match(sql, /array_agg\(tm\.winner_team_id order by tm\.table_number\)/i);
});

test('postseason RPC and private linkage remain service-role only', async () => {
  const sql = await migrationSql();
  assert.match(sql, /alter table private\.postseason_anchor_tiebreakers enable row level security/i);
  assert.match(sql, /revoke all on private\.postseason_anchor_tiebreakers from public, anon, authenticated/i);
  assert.match(sql, /revoke all on function public\.submit_postseason_lineup[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.submit_postseason_lineup[\s\S]*to service_role/i);
});
