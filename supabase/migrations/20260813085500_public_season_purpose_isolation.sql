-- Distinguish legitimate league seasons from QA/test fixtures at the data boundary.
-- Normal public season discovery, standings, and prize summaries must never infer
-- fixture status from names or participant display values.

alter table public.seasons
  add column if not exists purpose text not null default 'league';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.seasons'::regclass
      and conname = 'seasons_purpose_check'
  ) then
    alter table public.seasons
      add constraint seasons_purpose_check
      check (purpose in ('league', 'qa'));
  end if;
end
$$;

comment on column public.seasons.purpose is
  'Season data purpose. league seasons are eligible for normal public surfaces; qa seasons are isolated fixtures for testing/verification.';

-- Keep the existing registration implementation available only as an internal
-- helper, then expose the same public contract filtered by season purpose.
alter function public.list_public_season_registration()
  rename to list_all_season_registration_internal;

revoke execute on function public.list_all_season_registration_internal()
  from public, anon, authenticated, service_role;

create function public.list_public_season_registration()
returns table(
  id uuid,
  name text,
  status text,
  first_round_date date,
  team_capacity integer,
  minimum_committed_roster integer,
  team_count integer,
  confirmed_team_count integer,
  occupied_slots integer,
  open_team_slots integer,
  reserved_returning_slots integer,
  held_team_slots integer,
  applications_waiting integer,
  rostered_player_count integer,
  registered_player_count integer,
  free_agent_count integer,
  open_primary_roster_spots integer,
  at_risk_team_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select registration.*
  from public.list_all_season_registration_internal() registration
  join public.seasons season on season.id = registration.id
  where season.purpose = 'league';
$$;

revoke all on function public.list_public_season_registration() from public;
revoke all on function public.list_public_season_registration() from anon;
revoke all on function public.list_public_season_registration() from authenticated;
grant execute on function public.list_public_season_registration() to service_role;

-- Standings are public read models. Preserve their established implementation
-- behind internal helpers and make the public RPCs fail closed for QA seasons,
-- including callers that possess a QA season UUID directly.
alter function public.list_team_standings(uuid)
  rename to list_team_standings_internal;

revoke execute on function public.list_team_standings_internal(uuid)
  from public, anon, authenticated, service_role;

create function public.list_team_standings(target_season_id uuid)
returns table(
  season_id uuid,
  team_id uuid,
  team_name text,
  standings_rank integer,
  games_played integer,
  maximum_matches integer,
  standing_points integer,
  team_wins integer,
  team_losses integer,
  team_draws integer,
  match_points integer,
  match_points_against integer,
  point_differential integer,
  player_match_wins integer,
  player_match_losses integer,
  forfeits_won integer,
  forfeits_lost integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select standings.*
  from public.list_team_standings_internal(target_season_id) standings
  where exists (
    select 1
    from public.seasons season
    where season.id = target_season_id
      and season.purpose = 'league'
  );
$$;

revoke all on function public.list_team_standings(uuid) from public;
revoke all on function public.list_team_standings(uuid) from anon;
revoke all on function public.list_team_standings(uuid) from authenticated;
grant execute on function public.list_team_standings(uuid) to service_role;

alter function public.list_individual_standings(uuid)
  rename to list_individual_standings_internal;

revoke execute on function public.list_individual_standings_internal(uuid)
  from public, anon, authenticated, service_role;

create function public.list_individual_standings(target_season_id uuid)
returns table(
  season_id uuid,
  player_id uuid,
  display_name text,
  standings_rank integer,
  prize_rank integer,
  matches_played integer,
  minimum_matches integer,
  is_prize_eligible boolean,
  wins integer,
  losses integer,
  win_percentage numeric,
  games_won integer,
  games_lost integer,
  game_differential integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select standings.*
  from public.list_individual_standings_internal(target_season_id) standings
  where exists (
    select 1
    from public.seasons season
    where season.id = target_season_id
      and season.purpose = 'league'
  );
$$;

revoke all on function public.list_individual_standings(uuid) from public;
revoke all on function public.list_individual_standings(uuid) from anon;
revoke all on function public.list_individual_standings(uuid) from authenticated;
grant execute on function public.list_individual_standings(uuid) to service_role;

-- Prize summaries are likewise a normal public surface. Administrative prize
-- mutations remain unchanged and can still operate on QA fixtures when needed.
alter function public.get_season_prize_summary(uuid)
  rename to get_season_prize_summary_internal;

revoke execute on function public.get_season_prize_summary_internal(uuid)
  from public, anon, authenticated, service_role;

create function public.get_season_prize_summary(target_season_id uuid)
returns table(
  season_id uuid,
  season_name text,
  season_status text,
  player_count integer,
  paid_amount_cents integer,
  committed_amount_cents integer,
  entry_fee_cents integer,
  administration_amount_cents integer,
  projected_field_size integer,
  projected_gross_cents integer,
  projected_prize_pool_cents integer,
  team_allocation_basis_points integer,
  individual_allocation_basis_points integer,
  team_prize_pool_cents integer,
  individual_prize_pool_cents integer,
  configuration_version integer,
  configured_at timestamp with time zone,
  projected_payouts jsonb,
  finalized_payouts jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select summary.*
  from public.get_season_prize_summary_internal(target_season_id) summary
  where exists (
    select 1
    from public.seasons season
    where season.id = target_season_id
      and season.purpose = 'league'
  );
$$;

revoke all on function public.get_season_prize_summary(uuid) from public;
revoke all on function public.get_season_prize_summary(uuid) from anon;
revoke all on function public.get_season_prize_summary(uuid) from authenticated;
grant execute on function public.get_season_prize_summary(uuid) to service_role;
