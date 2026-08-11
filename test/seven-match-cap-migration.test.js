import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260811011800_seven_match_cap_multi_team_rounds.sql',
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

test('removes the one-player-per-round restriction', async () => {
  const sql = await migrationSql();

  assert.match(sql, /drop index if exists private\.one_lineup_player_per_round/i);
  assert.match(sql, /one_lineup_player_per_team_match/i);
  assert.match(sql, /\(lineup_id, player_id\)/i);
  assert.match(sql, /obsolete cross-team round guard/i);
  assert.match(sql, /Player is already scheduled for another team in this round/);
});

test('enforces a concurrency-safe seven regular-season appearance cap', async () => {
  const sql = await migrationSql();

  assert.match(sql, /enforce_regular_season_player_match_cap/i);
  assert.match(sql, /r\.stage = 'regular'/i);
  assert.match(sql, /existing_appearances >= 7/i);
  assert.match(sql, /more than seven regular-season matches/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
});

test('keeps postseason lineups outside the regular-season cap', async () => {
  const sql = await migrationSql();

  assert.match(sql, /target_stage is distinct from 'regular'/i);
  assert.match(sql, /return new/i);
});
