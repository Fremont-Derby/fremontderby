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
  'season_players',
  'player_matches',
  'team_match_forfeits',
  'season_race_chart_bands',
  'player_match_racks',
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

test('captain bootstrap policy requires the membership and team season to match', () => {
  assert.match(
    sql,
    /where t\.id = team_memberships\.team_id[\s\S]*t\.season_id = team_memberships\.season_id[\s\S]*t\.created_by = \(select auth\.uid\(\)\)/i,
  );
  assert.doesNotMatch(sql, /t\.season_id\s*=\s*t\.season_id/i);
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
  for (const table of [
    'player_contacts',
    'payment_status',
    'audit_events',
    'team_invitations',
    'free_agent_availability',
    'roster_availability',
    'team_lineups',
    'team_lineup_slots',
  ]) {
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
  for (const table of ['rounds', 'team_matches', 'player_matches', 'team_match_forfeits', 'player_match_racks']) {
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
  assert.match(sql, /grant select on public\.player_matches, public\.team_match_forfeits to anon, authenticated;/i);
  assert.match(sql, /grant all on public\.player_matches, public\.team_match_forfeits to service_role;/i);
  assert.match(sql, /grant select on public\.player_match_racks to anon, authenticated;/i);
  assert.match(sql, /grant all on public\.player_match_racks to service_role;/i);
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

test('roster management RPCs enforce captain boundaries and are service-role only', () => {
  assert.match(sql, /create or replace function public\.cancel_team_invitation\(/i);
  assert.match(sql, /Only pending invitations can be canceled/i);
  assert.match(sql, /Only the active captain can cancel invitations/i);
  assert.match(sql, /set status = 'canceled'/i);
  assert.match(sql, /create or replace function public\.remove_team_member\(/i);
  assert.match(sql, /Captain memberships cannot be removed through this path/i);
  assert.match(sql, /Only the active captain can remove team members/i);
  assert.match(sql, /set ends_at = now\(\)/i);
  assert.match(
    sql,
    /revoke all on function public\.cancel_team_invitation\(uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.cancel_team_invitation\(uuid, uuid\)[\s\S]*to service_role;/i,
  );
  assert.match(
    sql,
    /revoke all on function public\.remove_team_member\(uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.remove_team_member\(uuid, uuid\)[\s\S]*to service_role;/i,
  );
});

test('free-agent participation and availability storage have the expected visibility', () => {
  assert.match(sql, /create table public\.season_players/i);
  assert.match(sql, /participation_type text not null[\s\S]*'free_agent'/i);
  assert.match(sql, /alter table public\.season_players enable row level security;/i);
  assert.match(sql, /grant select on public\.season_players to anon, authenticated;/i);
  assert.match(sql, /create table private\.free_agent_availability/i);
  assert.match(
    sql,
    /revoke all on table private\.free_agent_availability from public, anon, authenticated;/i,
  );
});

test('free-agent RPCs are service-role only and actor-scoped', () => {
  assert.match(sql, /create or replace function public\.register_free_agent\(/i);
  assert.match(sql, /where p\.user_id = actor_user_id/i);
  assert.match(sql, /Rostered players cannot register as free agents for the same season/i);
  assert.match(sql, /on conflict \(season_id, player_id\) do update/i);
  assert.match(sql, /create or replace function public\.set_free_agent_availability\(/i);
  assert.match(sql, /availability_status must be available, unavailable, or unsure/i);
  assert.match(sql, /Active free-agent registration is required before setting availability/i);
  assert.match(
    sql,
    /revoke all on function public\.register_free_agent\(uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.register_free_agent\(uuid, uuid\)[\s\S]*to service_role;/i,
  );
  assert.match(
    sql,
    /revoke all on function public\.set_free_agent_availability\(uuid, uuid, text\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.set_free_agent_availability\(uuid, uuid, text\)[\s\S]*to service_role;/i,
  );
});

test('eligible free-agent read model is captain-scoped and service-role only', () => {
  assert.match(sql, /create or replace function public\.list_eligible_free_agents\(/i);
  assert.match(sql, /actor_user_id uuid/i);
  assert.match(sql, /target_team_id uuid/i);
  assert.match(sql, /target_round_id uuid/i);
  assert.match(sql, /Only the active captain can view eligible free agents/i);
  assert.match(sql, /Team is not scheduled for target round/i);
  assert.match(sql, /private\.active_team_roster_count\(target_team_id\)/i);
  assert.match(sql, /if active_roster_count >= 4 then[\s\S]*return;/i);
  assert.match(sql, /from private\.free_agent_availability fa/i);
  assert.match(sql, /fa\.status = 'available'/i);
  assert.match(
    sql,
    /revoke all on function public\.list_eligible_free_agents\(uuid, uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.list_eligible_free_agents\(uuid, uuid, uuid\)[\s\S]*to service_role;/i,
  );
});

test('roster availability storage is private and roster-member scoped', () => {
  assert.match(sql, /create table private\.roster_availability/i);
  assert.match(sql, /status text not null[\s\S]*'available'[\s\S]*'unavailable'[\s\S]*'unsure'/i);
  assert.match(
    sql,
    /revoke all on table private\.roster_availability from public, anon, authenticated;/i,
  );
  assert.match(sql, /create or replace function public\.set_roster_availability\(/i);
  assert.match(sql, /where p\.user_id = actor_user_id/i);
  assert.match(sql, /Active roster membership is required before setting availability/i);
  assert.match(sql, /on conflict \(round_id, player_id\) do update/i);
  assert.match(
    sql,
    /revoke all on function public\.set_roster_availability\(uuid, uuid, text\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.set_roster_availability\(uuid, uuid, text\)[\s\S]*to service_role;/i,
  );
});

test('team round availability read model is captain-scoped and includes eligible free agents', () => {
  assert.match(sql, /create or replace function public\.list_team_round_availability\(/i);
  assert.match(sql, /Only the active captain can view team round availability/i);
  assert.match(sql, /Team is not scheduled for target round/i);
  assert.match(sql, /from public\.team_memberships tm[\s\S]*'roster'::text as participation_type/i);
  assert.match(sql, /from private\.free_agent_availability fa[\s\S]*'free_agent'::text as participation_type/i);
  assert.match(sql, /where active_roster_count < 4/i);
  assert.match(sql, /fa\.status = 'available'/i);
  assert.match(
    sql,
    /revoke all on function public\.list_team_round_availability\(uuid, uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.list_team_round_availability\(uuid, uuid, uuid\)[\s\S]*to service_role;/i,
  );
});

test('lineup storage is private and prevents duplicate player scheduling per round', () => {
  assert.match(sql, /alter table public\.rounds[\s\S]*add column if not exists lineup_deadline_at timestamptz;/i);
  assert.match(sql, /create table private\.team_lineups/i);
  assert.match(sql, /create table private\.team_lineup_slots/i);
  assert.match(sql, /participation_type text not null[\s\S]*'roster'[\s\S]*'free_agent'[\s\S]*'forfeit'/i);
  assert.match(sql, /participation_type = 'forfeit' and player_id is null/i);
  assert.match(sql, /create unique index one_lineup_player_per_round[\s\S]*where player_id is not null;/i);
  assert.match(sql, /create unique index one_lineup_slot_per_team_round/i);
  assert.match(
    sql,
    /revoke all on table private\.team_lineups from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /revoke all on table private\.team_lineup_slots from public, anon, authenticated;/i,
  );
});

test('lineup submit RPC is captain-scoped and service-role only', () => {
  assert.match(sql, /create or replace function public\.submit_team_lineup\(/i);
  assert.match(sql, /lineup_slots jsonb/i);
  assert.match(sql, /Lineup cannot contain more than four slots/i);
  assert.match(sql, /Lineup deadline has passed/i);
  assert.match(sql, /Only the active captain can submit a lineup/i);
  assert.match(sql, /Lineup player is not eligible for this team round/i);
  assert.match(sql, /Player is already scheduled for another team in this round/i);
  assert.match(sql, /from generate_series\(1, 4\) as slot_numbers\(slot_number\)/i);
  assert.match(sql, /when parsed_slots\.player_id is null then 'forfeit'/i);
  assert.match(
    sql,
    /revoke all on function public\.submit_team_lineup\(uuid, uuid, uuid, jsonb\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.submit_team_lineup\(uuid, uuid, uuid, jsonb\)[\s\S]*to service_role;/i,
  );
});

test('visible lineup read model hides opponents until reveal rules allow it', () => {
  assert.match(sql, /drop function if exists public\.list_visible_team_lineups\(uuid, uuid, uuid\);/i);
  assert.match(sql, /create or replace function public\.list_visible_team_lineups\(/i);
  assert.match(sql, /Only the active captain can view team lineups/i);
  assert.match(sql, /opponent_visible := \(/i);
  assert.match(sql, /home_lineup\.team_id = target_match\.team_a_id/i);
  assert.match(sql, /away_lineup\.team_id = target_match\.team_b_id/i);
  assert.match(sql, /target_round\.lineup_deadline_at is not null[\s\S]*now\(\) > target_round\.lineup_deadline_at/i);
  assert.match(sql, /tl\.team_id = target_team_id[\s\S]*or opponent_visible/i);
  assert.match(sql, /p\.display_name/i);
  assert.match(sql, /pr\.fargo_rating/i);
  assert.match(sql, /pr\.rating_status/i);
  assert.match(
    sql,
    /revoke all on function public\.list_visible_team_lineups\(uuid, uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.list_visible_team_lineups\(uuid, uuid, uuid\)[\s\S]*to service_role;/i,
  );
});

test('submitted lineups generate player matches and explicit team forfeits', () => {
  assert.match(sql, /create table public\.player_matches/i);
  assert.match(sql, /player_a_id uuid not null references public\.players/i);
  assert.match(sql, /player_b_id uuid not null references public\.players/i);
  assert.match(sql, /unique \(team_match_id, slot_number\)/i);
  assert.match(sql, /create table public\.team_match_forfeits/i);
  assert.match(sql, /reason text not null default 'empty_lineup_slot'/i);
  assert.match(sql, /unique \(team_match_id, slot_number, forfeiting_team_id\)/i);
  assert.match(sql, /create or replace function private\.rebuild_generated_team_match_results\(/i);
  assert.match(sql, /delete from public\.player_matches/i);
  assert.match(sql, /delete from public\.team_match_forfeits/i);
  assert.match(sql, /where a_slots\.lineup_id = team_a_lineup_id[\s\S]*a_slots\.player_id is not null[\s\S]*b_slots\.player_id is not null/i);
  assert.match(sql, /where a_slots\.lineup_id = team_a_lineup_id[\s\S]*a_slots\.player_id is null/i);
  assert.match(sql, /where b_slots\.lineup_id = team_b_lineup_id[\s\S]*b_slots\.player_id is null/i);
  assert.match(sql, /set status = 'in_progress'/i);
  assert.match(sql, /create trigger refresh_generated_team_match_results_after_slot_insert/i);
  assert.match(sql, /create trigger refresh_generated_team_match_results_after_slot_update/i);
  assert.match(sql, /create trigger refresh_generated_team_match_results_after_slot_delete/i);
});

test('generated player matches lock player ratings at insert time', () => {
  assert.match(sql, /alter table public\.player_matches[\s\S]*player_a_fargo_rating integer/i);
  assert.match(sql, /alter table public\.player_matches[\s\S]*player_b_fargo_rating integer/i);
  assert.match(sql, /player_a_rating_status text[\s\S]*'unverified'[\s\S]*'provisional'[\s\S]*'established'/i);
  assert.match(sql, /player_b_rating_status text[\s\S]*'unverified'[\s\S]*'provisional'[\s\S]*'established'/i);
  assert.match(sql, /create or replace function private\.lock_player_match_ratings\(\)/i);
  assert.match(sql, /where pr\.player_id = new\.player_a_id/i);
  assert.match(sql, /where pr\.player_id = new\.player_b_id/i);
  assert.match(sql, /new\.player_a_fargo_rating := rating_a\.fargo_rating/i);
  assert.match(sql, /new\.player_b_fargo_rating := rating_b\.fargo_rating/i);
  assert.match(sql, /create trigger lock_player_match_ratings_before_insert/i);
});

test('season race chart bands are public read and trusted write only', () => {
  assert.match(sql, /create table public\.season_race_chart_bands/i);
  assert.match(sql, /primary key \(season_id, max_rating_diff\)/i);
  assert.match(sql, /grant select on public\.season_race_chart_bands to anon, authenticated;/i);
  assert.match(sql, /grant all on public\.season_race_chart_bands to service_role;/i);
  assert.match(
    sql,
    /create policy "Race chart bands are publicly readable"[\s\S]*on public\.season_race_chart_bands for select[\s\S]*using \(true\);/i,
  );
  assert.doesNotMatch(
    sql,
    /grant\s+(?:insert|update|delete|all)[^;]*public\.season_race_chart_bands[^;]*to\s+(?:anon|authenticated)/i,
  );
});

test('generated player matches lock race targets from the season chart', () => {
  assert.match(sql, /alter table public\.player_matches[\s\S]*race_to_a integer/i);
  assert.match(sql, /alter table public\.player_matches[\s\S]*race_to_b integer/i);
  assert.match(sql, /rating_band public\.season_race_chart_bands%rowtype/i);
  assert.match(sql, /abs\(rating_a\.fargo_rating - rating_b\.fargo_rating\) <= band\.max_rating_diff/i);
  assert.match(sql, /order by band\.max_rating_diff asc/i);
  assert.match(sql, /new\.race_to_a := rating_band\.stronger_race_to/i);
  assert.match(sql, /new\.race_to_b := rating_band\.weaker_race_to/i);
  assert.match(sql, /new\.race_to_a := rating_band\.weaker_race_to/i);
  assert.match(sql, /new\.race_to_b := rating_band\.stronger_race_to/i);
});

test('scorecard rack storage is public read and trusted write only', () => {
  assert.match(sql, /create table public\.player_match_racks/i);
  assert.match(sql, /rack_number integer not null check \(rack_number > 0\)/i);
  assert.match(sql, /discipline text not null check \(discipline in \('8-ball', '9-ball'\)\)/i);
  assert.match(sql, /winner_side text not null check \(winner_side in \('A', 'B'\)\)/i);
  assert.match(sql, /unique \(player_match_id, rack_number\)/i);
  assert.doesNotMatch(
    sql,
    /grant\s+(?:insert|update|delete|all)[^;]*public\.player_match_racks[^;]*to\s+(?:anon|authenticated)/i,
  );
});

test('scorecard RPC is service-role only and scorer-scoped', () => {
  assert.match(sql, /create or replace function private\.can_score_player_match\(/i);
  assert.match(sql, /p\.id in \(target_match\.player_a_id, target_match\.player_b_id\)/i);
  assert.match(sql, /tm\.team_id in \(target_match\.team_a_id, target_match\.team_b_id\)/i);
  assert.match(sql, /create or replace function public\.get_player_match_scorecard\(/i);
  assert.match(sql, /Only match players or active team captains can view the scorecard/i);
  assert.match(sql, /jsonb_agg\([\s\S]*'rackNumber'/i);
  assert.match(
    sql,
    /revoke all on function public\.get_player_match_scorecard\(uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.get_player_match_scorecard\(uuid, uuid\)[\s\S]*to service_role;/i,
  );
});

test('rack recording RPC advances score, discipline, and winner state', () => {
  assert.match(sql, /create or replace function public\.record_player_match_rack\(/i);
  assert.match(sql, /rack_winner_side must be A or B/i);
  assert.match(sql, /Player match is already complete/i);
  assert.match(sql, /Race targets are required before recording racks/i);
  assert.match(sql, /Only match players or active team captains can record racks/i);
  assert.match(sql, /next_score_a := target_match\.score_a \+ case when rack_winner_side = 'A'/i);
  assert.match(sql, /next_rack_number = target_match\.opening_block_length/i);
  assert.match(sql, /when target_match\.opening_discipline = '8-ball' then '9-ball'/i);
  assert.match(sql, /next_score_a >= target_match\.race_to_a/i);
  assert.match(sql, /insert into public\.player_match_racks/i);
  assert.match(sql, /update public\.player_matches[\s\S]*score_a = next_score_a[\s\S]*winner_side = next_winner_side/i);
  assert.match(
    sql,
    /revoke all on function public\.record_player_match_rack\(uuid, uuid, text\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.record_player_match_rack\(uuid, uuid, text\)[\s\S]*to service_role;/i,
  );
});

test('rack undo RPC removes only the latest unfinalized rack and writes an audit event', () => {
  assert.match(sql, /create or replace function public\.undo_player_match_rack\(/i);
  assert.match(sql, /Player match is finalized/i);
  assert.match(sql, /Only match players or active team captains can undo racks/i);
  assert.match(sql, /order by pmr\.rack_number desc[\s\S]*limit 1[\s\S]*for update/i);
  assert.match(sql, /Player match has no racks to undo/i);
  assert.match(sql, /delete from public\.player_match_racks/i);
  assert.match(sql, /current_discipline = next_discipline/i);
  assert.match(sql, /winner_side = null/i);
  assert.match(sql, /insert into private\.audit_events/i);
  assert.match(sql, /'player_match\.rack_undo'/i);
  assert.match(sql, /'removedRack', to_jsonb\(undone_rack\)/i);
  assert.match(
    sql,
    /revoke all on function public\.undo_player_match_rack\(uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.undo_player_match_rack\(uuid, uuid\)[\s\S]*to service_role;/i,
  );
});

test('player match finalization requires completed race state and writes an audit event', () => {
  assert.match(sql, /alter table public\.player_matches[\s\S]*finalized_at timestamptz/i);
  assert.match(sql, /alter table public\.player_matches[\s\S]*finalized_by uuid references auth\.users/i);
  assert.match(sql, /create or replace function public\.finalize_player_match\(/i);
  assert.match(sql, /Only match players or active team captains can finalize matches/i);
  assert.match(sql, /Race target must be reached before finalization/i);
  assert.match(sql, /Race targets are required before finalization/i);
  assert.match(sql, /Player match is not in a valid completed race state/i);
  assert.match(sql, /set status = 'finalized'/i);
  assert.match(sql, /insert into private\.audit_events/i);
  assert.match(sql, /'player_match\.finalize'/i);
  assert.match(sql, /to_jsonb\(target_match\)/i);
  assert.match(sql, /to_jsonb\(finalized_match\)/i);
  assert.match(
    sql,
    /revoke all on function public\.finalize_player_match\(uuid, uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.finalize_player_match\(uuid, uuid\)[\s\S]*to service_role;/i,
  );
});

test('player match correction is admin-only and preserves corrected audit state', () => {
  assert.match(sql, /alter table public\.player_matches[\s\S]*corrected_at timestamptz/i);
  assert.match(sql, /alter table public\.player_matches[\s\S]*corrected_by uuid references auth\.users/i);
  assert.match(sql, /alter table public\.player_matches[\s\S]*correction_reason text/i);
  assert.match(sql, /create or replace function public\.correct_player_match\(/i);
  assert.match(sql, /from private\.league_admins la[\s\S]*where la\.user_id = actor_user_id/i);
  assert.match(sql, /Player match must be finalized before correction/i);
  assert.match(sql, /Race targets are required before correction/i);
  assert.match(sql, /Player match is not in a valid corrected race state/i);
  assert.match(sql, /Corrected rack history must match corrected score/i);
  assert.match(sql, /delete from public\.player_match_racks pmr[\s\S]*where pmr\.player_match_id = target_player_match_id/i);
  assert.match(sql, /insert into public\.player_match_racks/i);
  assert.match(sql, /set score_a = corrected_score_a[\s\S]*status = 'corrected'/i);
  assert.match(sql, /insert into private\.audit_events/i);
  assert.match(sql, /'player_match\.correct'/i);
  assert.match(sql, /reason,[\s\S]*before_state,[\s\S]*after_state/i);
  assert.match(sql, /jsonb_build_object\([\s\S]*'match', to_jsonb\(target_match\)[\s\S]*'racks', before_racks/i);
  assert.match(sql, /jsonb_build_object\([\s\S]*'match', to_jsonb\(corrected_match\)[\s\S]*'racks', after_racks/i);
  assert.match(
    sql,
    /revoke all on function public\.correct_player_match\(uuid, uuid, text, integer, integer, text, jsonb\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.correct_player_match\(uuid, uuid, text, integer, integer, text, jsonb\)[\s\S]*to service_role;/i,
  );
});

test('team standings read model derives regular-season records from finalized results', () => {
  assert.match(sql, /create or replace function public\.list_team_standings\(/i);
  assert.match(sql, /r\.stage = 'regular'/i);
  assert.match(sql, /pm\.status in \('finalized', 'corrected'\)/i);
  assert.match(sql, /public\.team_match_forfeits/i);
  assert.match(sql, /count\(distinct sr\.slot_number\) = 4/i);
  assert.match(sql, /team_wins \* 2 \+ tmr\.team_draws/i);
  assert.match(sql, /dense_rank\(\) over/i);
  assert.match(sql, /standings\.standing_points desc[\s\S]*standings\.match_points desc[\s\S]*standings\.point_differential desc/i);
  assert.match(sql, /forfeits_won/i);
  assert.match(sql, /forfeits_lost/i);
  assert.match(
    sql,
    /revoke all on function public\.list_team_standings\(uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.list_team_standings\(uuid\)[\s\S]*to service_role;/i,
  );
});

test('individual standings read model ranks actual played matches with prize eligibility', () => {
  assert.match(sql, /create or replace function public\.list_individual_standings\(/i);
  assert.match(sql, /s\.individual_min_matches/i);
  assert.match(sql, /pm\.player_a_id as player_id[\s\S]*union all[\s\S]*pm\.player_b_id as player_id/i);
  assert.match(sql, /r\.stage = 'regular'/i);
  assert.match(sql, /pm\.status in \('finalized', 'corrected'\)/i);
  assert.match(sql, /pm\.winner_side in \('A', 'B'\)/i);
  assert.match(sql, /from public\.team_memberships tm/i);
  assert.match(sql, /from public\.season_players sp/i);
  assert.match(sql, /coalesce\(sum\(rpr\.wins \+ rpr\.losses\), 0\)::integer as matches_played/i);
  assert.match(sql, /pt\.matches_played >= ts\.individual_min_matches/i);
  assert.match(sql, /where standings\.is_prize_eligible/i);
  assert.match(sql, /standings\.win_percentage desc[\s\S]*standings\.wins desc/i);
  assert.match(sql, /eligible_standings\.prize_rank/i);
  assert.doesNotMatch(
    sql,
    /list_individual_standings[\s\S]*public\.team_match_forfeits[\s\S]*comment on function public\.list_individual_standings/i,
  );
  assert.match(
    sql,
    /revoke all on function public\.list_individual_standings\(uuid\)[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.list_individual_standings\(uuid\)[\s\S]*to service_role;/i,
  );
});
