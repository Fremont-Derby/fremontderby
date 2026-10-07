import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260822063500_jfl_concurrent_captaincy_invariant.sql',
  import.meta.url,
);

const sql = await readFile(migrationUrl, 'utf8');

test('JFL repair keeps one truthful current captain per team and audits demotions', () => {
  assert.match(sql, /row_number\(\)[\s\S]*partition by tm\.team_id/i);
  assert.match(sql, /assigned_captain_player_id = tm\.player_id/i);
  assert.match(sql, /set role = 'player'/i);
  assert.match(sql, /team\.captain_invariant_repair/i);
  assert.match(sql, /before_state[\s\S]*after_state/i);
  assert.match(sql, /create unique index[^;]*one_current_captain_per_team[\s\S]*on jfl\.team_memberships \(team_id\)[\s\S]*role = 'captain'[\s\S]*ends_at is null/i);
});

test('JFL repair preserves one concurrent captaincy while retaining completed history', () => {
  assert.match(sql, /partition by tm\.player_id/i);
  assert.match(sql, /s\.status in \('registration', 'active', 'playoffs'\)/i);
  assert.match(sql, /set assigned_captain_player_id = null/i);
  assert.doesNotMatch(sql, /s\.status in \('completed', 'archived'\)/i);
});

test('all JFL captain writes serialize and reject cross-season or same-team conflicts', () => {
  assert.match(sql, /create or replace function jfl_private\.enforce_concurrent_captaincy/i);
  assert.match(sql, /pg_advisory_xact_lock[\s\S]*new\.player_id/i);
  assert.match(sql, /Player already captains another open or live team/i);
  assert.match(sql, /Team already has a current captain/i);
  assert.match(sql, /before insert or update of season_id, team_id, player_id, role, ends_at[\s\S]*on jfl\.team_memberships/i);
  assert.match(sql, /revoke all on function jfl_private\.enforce_concurrent_captaincy\(\)[\s\S]*from public, anon, authenticated/i);
});

test('opening a draft season rechecks its captains against open and live teams', () => {
  assert.match(sql, /create or replace function jfl_private\.guard_concurrent_captaincy_season_status/i);
  assert.match(sql, /old\.status not in \('registration', 'active', 'playoffs'\)/i);
  assert.match(sql, /Season cannot open while a captain leads another open or live team/i);
  assert.match(sql, /before update of status on jfl\.seasons/i);
  assert.match(sql, /revoke all on function jfl_private\.guard_concurrent_captaincy_season_status\(\)[\s\S]*from public, anon, authenticated/i);
});

test('JFL admin candidates expose existing concurrent captaincy before assignment', () => {
  assert.match(sql, /create or replace function jfl\.list_admin_team_captain_candidates/i);
  assert.match(sql, /join jfl\.seasons captain_season[\s\S]*captain_season\.status in \('registration', 'active', 'playoffs'\)/i);
  assert.match(sql, /captain_team_id[\s\S]*captain_team_name/i);
  assert.match(sql, /grant execute on function jfl\.list_admin_team_captain_candidates\(uuid, uuid, uuid\)[\s\S]*to service_role/i);
});
