-- Minimal LOCAL PostgreSQL fixture; not a migration or live setup path.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema jfl;
create schema jfl_private;
create schema dru;
create table dru.approval_sentinel(id integer primary key, value text);
insert into dru.approval_sentinel values(1,'Preserve peer lane');
create table jfl.players(id uuid primary key, user_id uuid, display_name text);
create table jfl.seasons(id uuid primary key, name text, status text, team_capacity integer default 8, conditional_hold_days integer default 14);
create table jfl.teams(id uuid primary key default gen_random_uuid(), season_id uuid, name text, created_by uuid);
create table jfl.team_memberships(id uuid primary key default gen_random_uuid(), season_id uuid, team_id uuid, player_id uuid, role text, ends_at timestamptz);
create table jfl_private.league_admins(user_id uuid primary key);
create table jfl_private.team_applications(id uuid primary key, season_id uuid, applicant_player_id uuid, proposed_team_name text,
  status text default 'applied', team_id uuid, slot_id uuid, admin_notes text, reviewed_at timestamptz, reviewed_by_user_id uuid, updated_at timestamptz);
create table jfl_private.season_team_slots(id uuid primary key default gen_random_uuid(), season_id uuid, team_id uuid,
  assigned_captain_player_id uuid, status text, hold_expires_at timestamptz, source_team_id uuid);
create table jfl_private.audit_events(id uuid primary key default gen_random_uuid(), actor_user_id uuid, action text, entity_type text, entity_id uuid, after_state jsonb);
create table jfl.user_notifications(id uuid primary key default gen_random_uuid(), user_id uuid, kind text not null, title text, body text, payload jsonb,
  read_at timestamptz, created_at timestamptz not null default now(), recipient_user_id uuid, href text, team_id uuid,
  team_match_id uuid, season_id uuid, created_by uuid);
alter table jfl.user_notifications enable row level security;
create function jfl_private.expire_season_team_registration(uuid) returns void language plpgsql as $$begin return; end;$$;
create function jfl_private.refresh_team_slot_readiness(uuid) returns void language plpgsql as $$begin return; end;$$;
grant usage on schema jfl,jfl_private to service_role;
