import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260811013000_seal_blind_lineups.sql',
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

test('locks a team lineup after its first submission', async () => {
  const sql = await migrationSql();

  assert.match(sql, /Lineup is locked after submission/);
  assert.match(sql, /private\.team_lineups existing_lineup/i);
  assert.match(sql, /existing_lineup\.team_match_id = target_match\.id/i);
  assert.match(sql, /existing_lineup\.team_id = target_team_id/i);
});

test('reveals opposing lineup only after both teams submit', async () => {
  const sql = await migrationSql();

  assert.match(sql, /home_lineup\.team_id = target_match\.team_a_id/i);
  assert.match(sql, /away_lineup\.team_id = target_match\.team_b_id/i);
  assert.doesNotMatch(
    sql.match(/new_visibility text := \$new\$([\s\S]*?)\$new\$/)?.[1] ?? '',
    /lineup_deadline_at/i,
  );
});
