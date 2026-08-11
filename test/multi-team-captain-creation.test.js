import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260811115000_reconcile_multi_team_captain_creation.sql',
  import.meta.url,
);

const sql = await readFile(migrationUrl, 'utf8');

test('team creation blocks only existing captaincy, not ordinary memberships', () => {
  assert.match(sql, /tm\.role = 'captain'/i);
  assert.match(sql, /You already captain a team in this season and cannot create another/i);
  assert.doesNotMatch(sql, /You already belong to a team in this season/i);
});

test('captain uniqueness keeps the existing canonical index', () => {
  assert.match(sql, /one_active_captain_team_per_season/i);
  assert.match(sql, /season_id, player_id[\s\S]*role = 'captain'[\s\S]*ends_at is null/i);
});

test('team creation remains service-role only', () => {
  assert.match(sql, /revoke all on function public\.create_team_with_captain\(uuid, uuid, text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.create_team_with_captain\(uuid, uuid, text\) to service_role/i);
});
