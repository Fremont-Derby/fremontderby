import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260813085500_public_season_purpose_isolation.sql',
  import.meta.url,
);

async function migrationSql() {
  return readFile(migrationUrl, 'utf8');
}

test('season purpose is explicit and constrained instead of inferred from names', async () => {
  const sql = await migrationSql();
  assert.match(sql, /add column if not exists purpose text not null default 'league'/i);
  assert.match(sql, /check \(purpose in \('league', 'qa'\)\)/i);
  assert.doesNotMatch(sql, /BOT WARGAME|Europe-001|Season 1 War Game|Solstice Season/i);
  assert.doesNotMatch(sql, /update public\.seasons\s+set purpose/i);
});

test('normal public read models fail closed for QA seasons', async () => {
  const sql = await migrationSql();
  assert.match(sql, /create function public\.list_public_season_registration\(\)/i);
  assert.match(sql, /create function public\.list_team_standings\(target_season_id uuid\)/i);
  assert.match(sql, /create function public\.list_individual_standings\(target_season_id uuid\)/i);
  assert.match(sql, /create function public\.get_season_prize_summary\(target_season_id uuid\)/i);
  assert.equal((sql.match(/season\.purpose = 'league'/gi) ?? []).length, 4);
});

test('unfiltered helper RPCs lose direct execution grants', async () => {
  const sql = await migrationSql();
  for (const helper of [
    'list_all_season_registration_internal',
    'list_team_standings_internal',
    'list_individual_standings_internal',
    'get_season_prize_summary_internal',
  ]) {
    assert.match(sql, new RegExp(`revoke execute on function public\\.${helper}`, 'i'));
  }
  assert.equal((sql.match(/grant execute on function public\./gi) ?? []).length, 4);
});
