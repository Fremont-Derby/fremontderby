import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260810184500_start_season_playoffs.sql',
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

test('playoff migration seeds only after a complete seven-round eight-team regular season', async () => {
  const sql = await migrationSql();

  assert.match(sql, /regular_round_count <> 7/);
  assert.match(sql, /team_count <> 8/);
  assert.match(sql, /games_played = 7/);
  assert.match(sql, /maximum_matches = 7/);
});

test('playoff migration persists #1 vs #4 and #2 vs #3 semifinal pairings', async () => {
  const sql = await migrationSql();

  assert.match(sql, /seed_team_ids\[1\],\s*seed_team_ids\[4\]/);
  assert.match(sql, /seed_team_ids\[2\],\s*seed_team_ids\[3\]/);
  assert.match(sql, /'semifinal'/);
  assert.match(sql, /set status = 'playoffs'/);
});

test('playoff transition is trusted-server only and idempotent', async () => {
  const sql = await migrationSql();

  assert.match(sql, /private\.league_admins/);
  assert.match(sql, /existing_round_id is not null/);
  assert.match(sql, /revoke all on function public\.start_season_playoffs\(uuid, uuid\)[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.start_season_playoffs\(uuid, uuid\)[\s\S]*to service_role/);
});
