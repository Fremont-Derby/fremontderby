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

test('private protected data tables are not browser-readable', () => {
  for (const table of ['player_contacts', 'payment_status', 'audit_events', 'team_invitations']) {
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
  assert.match(sql, /from private\.league_admins la/i);
  assert.match(sql, /Actor is not a league admin/i);
  assert.match(sql, /Season schedule already exists/i);
  assert.match(sql, /inserted_round_count <> 7/i);
  assert.match(sql, /inserted_match_count <> 28/i);
});

test('season publication RPC writes an audit event in the same transaction', () => {
  assert.match(sql, /create table private\.audit_events/i);
  assert.match(sql, /actor_user_id uuid references auth\.users\(id\) on delete set null/i);
  assert.match(sql, /before_state jsonb/i);
  assert.match(sql, /after_state jsonb/i);
  assert.match(sql, /insert into private\.audit_events/i);
  assert.match(sql, /'season\.publish_schedule'/i);
  assert.match(sql, /jsonb_build_object\('status', current_status\)/i);
  assert.match(sql, /'roundCount', inserted_round_count/i);
  assert.match(sql, /'teamMatchCount', inserted_match_count/i);
});

test('player profile RPC is service-role only and actor-scoped', () => {
  assert.match(sql, /create or replace function public\.upsert_player_profile\(/i);
  assert.match(sql, /actor_user_id uuid/i);
  assert.match(sql, /profile_display_name text/i);
  assert.match(sql, /normalized_display_name := btrim\(profile_display_name\);/i);
  assert.match(sql, /on conflict \(user_id\) do update/i);
  assert.match(sql, /set display_name = excluded\.display_name/i);
  assert.match(
    sql,
    /revoke all on function public\.upsert_player_profile\(uuid, text\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.upsert_player_profile\(uuid, text\)[\s\S]*to service_role;/i,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.upsert_player_profile\(uuid, text\)[\s\S]*to (?:anon|authenticated);/i,
  );
});

test('team creation RPC creates captain membership and is service-role only', () => {
  assert.match(sql, /create or replace function public\.create_team_with_captain\(/i);
  assert.match(sql, /actor_user_id uuid/i);
  assert.match(sql, /target_season_id uuid/i);
  assert.match(sql, /team_name text/i);
  assert.match(sql, /from public\.players p[\s\S]*where p\.user_id = actor_user_id;/i);
  assert.match(sql, /Player profile is required before creating a team/i);
  assert.match(sql, /insert into public\.teams/i);
  assert.match(sql, /insert into public\.team_memberships/i);
  assert.match(sql, /'captain'/i);
  assert.match(
    sql,
    /revoke all on function public\.create_team_with_captain\(uuid, uuid, text\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.create_team_with_captain\(uuid, uuid, text\)[\s\S]*to service_role;/i,
  );
  assert.doesNotMatch(
    sql,
    /grant execute on function public\.create_team_with_captain\(uuid, uuid, text\)[\s\S]*to (?:anon|authenticated);/i,
  );
});

test('team invitations are private and service-role controlled', () => {
  assert.match(sql, /create table private\.team_invitations/i);
  assert.match(sql, /status text not null default 'pending'/i);
  assert.match(sql, /one_pending_team_invitation_per_player/i);
  assert.match(sql, /revoke all on table private\.team_invitations from public, anon, authenticated;/i);
  assert.match(sql, /grant all on table private\.team_invitations to service_role;/i);
});

test('team invitation RPCs enforce captain and invited-player boundaries', () => {
  assert.match(sql, /create or replace function public\.invite_player_to_team\(/i);
  assert.match(sql, /Only the active captain can invite players/i);
  assert.match(sql, /Team roster has no open primary spots/i);
  assert.match(sql, /create or replace function public\.respond_to_team_invitation\(/i);
  assert.match(sql, /Only the invited player can respond/i);
  assert.match(sql, /insert into public\.team_memberships/i);
  assert.match(sql, /response_status must be accepted or declined/i);
  assert.match(
    sql,
    /revoke all on function public\.invite_player_to_team\(uuid, uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.invite_player_to_team\(uuid, uuid, uuid\)[\s\S]*to service_role;/i,
  );
  assert.match(
    sql,
    /revoke all on function public\.respond_to_team_invitation\(uuid, uuid, text\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.respond_to_team_invitation\(uuid, uuid, text\)[\s\S]*to service_role;/i,
  );
});
