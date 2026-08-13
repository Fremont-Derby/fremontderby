import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../supabase/migrations/20260813095500_complete_league_season_integrity.sql', import.meta.url);

test('league seasons cannot close with unresolved competitive team matches', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /coalesce\(new\.purpose, 'league'\) = 'league'/i);
  assert.match(sql, /join public\.team_matches tm on tm\.round_id = r\.id/i);
  assert.match(sql, /tm\.status not in \('finalized', 'corrected'\)/i);
  assert.match(sql, /raise exception 'Competitive team matchups still need final results before closing the season'/i);
  assert.match(sql, /unresolved_competitive_team_matches = 0/i);
  assert.match(sql, /Competitive team matchups still have unresolved results/i);
});

test('QA fixtures remain isolated from the league-only completion guard', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /new\.status = 'complete'/i);
  assert.match(sql, /coalesce\(new\.purpose, 'league'\) = 'league'/i);
  assert.doesNotMatch(sql, /new\.purpose = 'qa'[\s\S]*raise exception/i);
});

test('completion guard remains server-owned and preserves history', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /revoke all on function private\.guard_explicit_season_close\(\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function private\.guard_explicit_season_close\(\) to service_role/i);
  assert.doesNotMatch(sql, /delete from public\.(seasons|rounds|team_matches|player_matches|player_match_racks)/i);
});
