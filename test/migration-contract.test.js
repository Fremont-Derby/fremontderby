import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql = fs.readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => fs.readFileSync(`supabase/migrations/${file}`, 'utf8'))
  .join('\n');

const publicTables = [
  'players',
  'player_ratings',
  'seasons',
  'teams',
  'team_memberships',
  'rounds',
  'team_matches',
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

test('league-admin authority is private and checked through a definer helper', () => {
  assert.match(sql, /create table private\.league_admins/i);
  assert.match(
    sql,
    /revoke all on table private\.league_admins from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant all on table private\.league_admins, private\.player_contacts, private\.payment_status to service_role;/i,
  );
  assert.match(sql, /create or replace function private\.is_league_admin\(\)/i);
  assert.match(sql, /security definer/i);
  assert.doesNotMatch(
    sql,
    /grant\s+select\s+on\s+private\.league_admins\s+to\s+(?:anon|authenticated)/i,
  );
});

test('captain roster writes stay scoped to captained teams and roster cap', () => {
  assert.match(sql, /grant update \(ends_at\) on public\.team_memberships to authenticated;/i);
  assert.match(sql, /create or replace function private\.active_team_roster_count\(target_team_id uuid\)/i);
  assert.match(
    sql,
    /create policy "Captains can add roster players to own team"[\s\S]*role = 'player'[\s\S]*private\.is_team_captain\(team_id\)[\s\S]*private\.active_team_roster_count\(team_id\)\) < 4/i,
  );
  assert.match(
    sql,
    /create policy "Captains can end roster player memberships on own team"[\s\S]*role = 'player'[\s\S]*ends_at is null[\s\S]*private\.is_team_captain\(team_id\)[\s\S]*ends_at is not null/i,
  );
});

test('normal authenticated users cannot publish seasons directly', () => {
  assert.doesNotMatch(
    sql,
    /grant\s+(?:insert|update|delete|all)[^;]*public\.seasons[^;]*to\s+authenticated/i,
  );
});

test('private contact and payment data are not browser-readable', () => {
  for (const table of ['player_contacts', 'payment_status']) {
    assert.match(sql, new RegExp(`create table private\\.${table}`, 'i'));
    assert.match(
      sql,
      new RegExp(`revoke all on table private\\.${table} from public, anon, authenticated;`, 'i'),
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`grant\\s+select\\s+on\\s+private\\.${table}\\s+to\\s+(?:anon|authenticated)`, 'i'),
    );
  }
});

test('published schedule tables are public read and trusted write only', () => {
  for (const table of ['rounds', 'team_matches']) {
    assert.match(sql, new RegExp(`create table public\\.${table}`, 'i'));
    assert.match(
      sql,
      new RegExp(`create policy "[^"]+"\\s+on public\\.${table} for select[\\s\\S]*using \\(true\\);`, 'i'),
    );
    assert.doesNotMatch(
      sql,
      new RegExp(`grant\\s+(?:insert|update|delete|all)[^;]*public\\.${table}[^;]*to\\s+(?:anon|authenticated)`, 'i'),
    );
  }

  assert.match(sql, /grant select on public\.rounds, public\.team_matches to anon, authenticated;/i);
  assert.match(sql, /grant all on public\.rounds, public\.team_matches to service_role;/i);
  assert.match(sql, /unique \(season_id, stage, round_number\)/i);
  assert.match(sql, /unique \(round_id, table_number\)/i);
});

test('season publication RPC is service-role only and transactional', () => {
  assert.match(sql, /create or replace function public\.publish_season_schedule\(/i);
  assert.match(sql, /language plpgsql/i);
  assert.match(sql, /security definer/i);
  assert.match(
    sql,
    /revoke all on function public\.publish_season_schedule\(uuid, uuid, text, jsonb\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.publish_season_schedule\(uuid, uuid, text, jsonb\)[\s\S]*to service_role;/i,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.publish_season_schedule\(uuid, uuid, text, jsonb\)[\s\S]*to (?:anon|authenticated);/i,
  );
  assert.match(sql, /for update;/i);
  assert.match(sql, /Season schedule already exists/i);
  assert.match(sql, /inserted_round_count <> 7/i);
  assert.match(sql, /inserted_match_count <> 28/i);
});
