import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260810210207_advance_season_to_championship.sql',
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

test('championship advancement requires two complete non-tied semifinals', async () => {
  const sql = await migrationSql();

  assert.match(sql, /semifinal_match_count <> 2/);
  assert.match(sql, /completed_semifinal_count <> 2/);
  assert.match(sql, /tied_semifinal_count > 0/);
  assert.match(sql, /Two distinct semifinal winners are required/);
});

test('championship advancement persists and finalizes the postseason transition idempotently', async () => {
  const sql = await migrationSql();

  assert.match(sql, /existing_round_id is not null/);
  assert.match(sql, /set status = 'finalized'/);
  assert.match(sql, /'championship'/);
  assert.match(sql, /winner_team_ids\[1\],\s*winner_team_ids\[2\]/);
});

test('championship advancement is restricted to trusted league-admin execution', async () => {
  const sql = await migrationSql();

  assert.match(sql, /private\.league_admins/);
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /revoke all on function public\.advance_season_to_championship\(uuid, uuid\)[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.advance_season_to_championship\(uuid, uuid\)[\s\S]*to service_role/);
});
