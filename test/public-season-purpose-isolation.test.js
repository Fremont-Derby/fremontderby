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

  // Existing pilot QA fixtures are classified by immutable season identity.
  assert.match(sql, /97d9f5a0-6c3e-4457-9c95-18e4804b7778/i);
  assert.match(sql, /c92580f5-0512-4c81-b858-4baac3683e9b/i);
});

test('normal public read models fail closed for QA seasons', async () => {
  const sql = await migrationSql();

  assert.match(sql, /create function public\.list_public_season_registration\(\)/i);
  assert.match(sql, /create function public\.list_team_standings\(target_season_id uuid\)/i);
  assert.match(sql, /create function public\.list_individual_standings\(target_season_id uuid\)/i);
  assert.match(sql, /create function public\.get_season_prize_summary\(target_season_id uuid\)/i);

  const leagueGuards = sql.match(/season\.purpose = 'league'/gi) ?? [];
  assert.equal(leagueGuards.length, 4);
});

test('unfiltered helper RPCs are not callable browser or service-role entry points', async () => {
  const sql = await migrationSql();

  for (const helper of [
    'list_all_season_registration_internal\\(\\)',
    'list_team_standings_internal\\(uuid\\)',
    'list_individual_standings_internal\\(uuid\\)',
    'get_season_prize_summary_internal\\(uuid\\)',
  ]) {
    assert.match(
      sql,
      new RegExp(`revoke execute on function public\\.${helper}\\s+from public, anon, authenticated, service_role`, 'i'),
    );
  }

  for (const publicRpc of [
    'list_public_season_registration\\(\\)',
    'list_team_standings\\(uuid\\)',
    'list_individual_standings\\(uuid\\)',
    'get_season_prize_summary\\(uuid\\)',
  ]) {
    assert.match(
      sql,
      new RegExp(`grant execute on function public\\.${publicRpc} to service_role`, 'i'),
    );
  }
});
