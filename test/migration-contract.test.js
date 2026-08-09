import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readFileSync(
  'supabase/migrations/20260809235600_identity_and_rosters.sql',
  'utf8',
);

const publicTables = [
  'players',
  'player_ratings',
  'seasons',
  'teams',
  'team_memberships',
];

test('every exposed public table enables row level security', () => {
  for (const table of publicTables) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security;`, 'i'),
      `${table} must enable RLS`,
    );
  }
});

test('browser roles cannot directly mutate ratings', () => {
  assert.doesNotMatch(
    sql,
    /grant\s+(?:insert|update|delete|all)[^;]*player_ratings[^;]*to\s+(?:anon|authenticated)/i,
  );
  assert.match(sql, /grant select on[\s\S]*player_ratings[\s\S]*to anon, authenticated;/i);
});

test('player self-service grants are column scoped', () => {
  assert.match(sql, /grant insert \(user_id, display_name\) on public\.players to authenticated;/i);
  assert.match(sql, /grant update \(display_name\) on public\.players to authenticated;/i);
  assert.doesNotMatch(sql, /grant (?:insert|update) on public\.players to authenticated;/i);
});

test('active team membership is unique per season rather than globally', () => {
  assert.match(
    sql,
    /create unique index one_active_team_membership_per_season[\s\S]*\(season_id, player_id\)[\s\S]*where ends_at is null;/i,
  );
  assert.match(sql, /foreign key \(team_id, season_id\)[\s\S]*references public\.teams\(id, season_id\)/i);
});

test('ownership policies use authenticated identity and avoid user metadata for authorization', () => {
  assert.match(sql, /auth\.uid\(\)/);
  assert.doesNotMatch(sql, /raw_user_meta_data|user_metadata/i);
  assert.match(sql, /to authenticated/i);
});

test('service role is explicitly server-side database authority', () => {
  assert.match(sql, /grant all on[\s\S]*to service_role;/i);
  assert.match(sql, /trusted server\/service-role operations own rating changes/i);
});
