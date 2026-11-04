-- Captured qualified JFL functions; local-only minimal relations, no hosted fixture writes.
create role anon;create role authenticated;create role service_role;create schema auth;create schema jfl;create schema jfl_private;
create table auth.users(id uuid primary key);
create table jfl_private.league_admins(user_id uuid primary key references auth.users);
create table jfl.seasons(id uuid primary key default gen_random_uuid(),name text not null,status text not null,purpose text not null default 'league',league_night text,first_round_date date,roster_lock_round integer,opening_block_length integer,individual_min_matches integer,round_interval_days integer,default_table_numbers integer[],race_chart_version text,playoff_team_count integer,playoff_anchor_tiebreaker boolean,updated_at timestamptz default now());
create table jfl_private.audit_events(id uuid primary key default gen_random_uuid(),actor_user_id uuid,action text,entity_type text,entity_id uuid,before_state jsonb,after_state jsonb);
create table jfl.teams(id uuid primary key default gen_random_uuid(),season_id uuid references jfl.seasons,name text);
create table jfl.team_memberships(id uuid primary key default gen_random_uuid(),team_id uuid,ends_at timestamptz);
create table jfl.rounds(id uuid primary key default gen_random_uuid(),season_id uuid,round_number int,stage text,scheduled_on date);
create table jfl.team_matches(id uuid primary key default gen_random_uuid(),round_id uuid,table_number int,team_a_id uuid,team_b_id uuid);
CREATE OR REPLACE FUNCTION jfl_private.validate_season_setup_table_numbers(table_numbers integer[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select table_numbers is not null
    and array_length(table_numbers, 1) = 4
    and not exists (
      select 1
      from unnest(table_numbers) as table_number(value)
      where value is null or value < 1
    )
    and (
      select count(distinct value)
      from unnest(table_numbers) as table_number(value)
    ) = 4;
$function$
;
CREATE OR REPLACE FUNCTION jfl.configure_season_setup(actor_user_id uuid, target_season_id uuid, configured_season_name text, configured_league_night text, configured_first_round_date date, configured_roster_lock_round integer, configured_opening_block_length integer, configured_individual_min_matches integer, configured_round_interval_days integer, configured_table_numbers integer[], configured_race_chart_version text, configured_playoff_team_count integer, configured_playoff_anchor_tiebreaker boolean)
 RETURNS TABLE(id uuid, name text, status text, league_night text, first_round_date date, roster_lock_round integer, opening_block_length integer, individual_min_matches integer, round_interval_days integer, default_table_numbers integer[], race_chart_version text, playoff_team_count integer, playoff_anchor_tiebreaker boolean, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  normalized_name text;
  normalized_league_night text;
  normalized_race_chart_version text;
  before_state jsonb;
  configured_id uuid;
  registration_season_count integer;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if not exists (
    select 1
    from jfl_private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  normalized_name := btrim(configured_season_name);
  if normalized_name is null or char_length(normalized_name) = 0 or char_length(normalized_name) > 80 then
    raise exception 'season_name must be 80 characters or fewer';
  end if;

  normalized_league_night := btrim(configured_league_night);
  if normalized_league_night is null or char_length(normalized_league_night) = 0 or char_length(normalized_league_night) > 40 then
    raise exception 'league_night must be 40 characters or fewer';
  end if;

  normalized_race_chart_version := btrim(configured_race_chart_version);
  if normalized_race_chart_version is null
      or char_length(normalized_race_chart_version) = 0
      or char_length(normalized_race_chart_version) > 80 then
    raise exception 'race_chart_version must be 80 characters or fewer';
  end if;

  if configured_first_round_date is null then
    raise exception 'first_round_date is required';
  end if;

  if configured_roster_lock_round is null or configured_roster_lock_round < 1 then
    raise exception 'roster_lock_round must be greater than zero';
  end if;

  if configured_opening_block_length is null or configured_opening_block_length < 1 then
    raise exception 'opening_block_length must be greater than zero';
  end if;

  if configured_individual_min_matches is null or configured_individual_min_matches < 1 then
    raise exception 'individual_min_matches must be greater than zero';
  end if;

  if configured_round_interval_days is null or configured_round_interval_days < 1 then
    raise exception 'round_interval_days must be greater than zero';
  end if;

  if not jfl_private.validate_season_setup_table_numbers(configured_table_numbers) then
    raise exception 'table_numbers must contain four unique positive integers';
  end if;

  if configured_playoff_team_count is null or configured_playoff_team_count < 2 then
    raise exception 'playoff_team_count must be at least two';
  end if;

  if target_season_id is null then
    lock table jfl.seasons in share row exclusive mode;

    select count(*)::integer
      into registration_season_count
    from jfl.seasons s
    where s.status = 'registration';

    if registration_season_count > 1 then
      raise exception 'Multiple registration seasons exist; choose a season before saving setup';
    end if;

    if registration_season_count = 1 then
      select s.id
        into target_season_id
      from jfl.seasons s
      where s.status = 'registration'
      limit 1;
    end if;
  end if;

  if target_season_id is null then
    insert into jfl.seasons (
      name,
      status,
      roster_lock_round,
      opening_block_length,
      individual_min_matches,
      league_night,
      first_round_date,
      round_interval_days,
      default_table_numbers,
      race_chart_version,
      playoff_team_count,
      playoff_anchor_tiebreaker,
      updated_at
    ) values (
      normalized_name,
      'registration',
      configured_roster_lock_round,
      configured_opening_block_length,
      configured_individual_min_matches,
      normalized_league_night,
      configured_first_round_date,
      configured_round_interval_days,
      configured_table_numbers,
      normalized_race_chart_version,
      configured_playoff_team_count,
      coalesce(configured_playoff_anchor_tiebreaker, true),
      now()
    )
    returning seasons.id into configured_id;
  else
    select to_jsonb(s)
      into before_state
    from jfl.seasons s
    where s.id = target_season_id
    for update;

    if not found then
      raise exception 'Season not found';
    end if;

    if not exists (
      select 1
      from jfl.seasons s
      where s.id = target_season_id
        and s.status in ('draft', 'registration')
    ) then
      raise exception 'Season setup can only change before publication';
    end if;

    update jfl.seasons
    set name = normalized_name,
        roster_lock_round = configured_roster_lock_round,
        opening_block_length = configured_opening_block_length,
        individual_min_matches = configured_individual_min_matches,
        league_night = normalized_league_night,
        first_round_date = configured_first_round_date,
        round_interval_days = configured_round_interval_days,
        default_table_numbers = configured_table_numbers,
        race_chart_version = normalized_race_chart_version,
        playoff_team_count = configured_playoff_team_count,
        playoff_anchor_tiebreaker = coalesce(configured_playoff_anchor_tiebreaker, true),
        updated_at = now()
    where seasons.id = target_season_id
    returning seasons.id into configured_id;
  end if;

  insert into jfl_private.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  )
  select
    actor_user_id,
    'season.configure_setup',
    'season',
    s.id,
    before_state,
    to_jsonb(s)
  from jfl.seasons s
  where s.id = configured_id;

  return query
  select
    s.id,
    s.name,
    s.status,
    s.league_night,
    s.first_round_date,
    s.roster_lock_round,
    s.opening_block_length,
    s.individual_min_matches,
    s.round_interval_days,
    s.default_table_numbers,
    s.race_chart_version,
    s.playoff_team_count,
    s.playoff_anchor_tiebreaker,
    s.updated_at
  from jfl.seasons s
  where s.id = configured_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION jfl.create_season_setup(actor_user_id uuid, configured_season_name text, configured_league_night text, configured_first_round_date date, configured_roster_lock_round integer, configured_opening_block_length integer, configured_individual_min_matches integer, configured_round_interval_days integer, configured_table_numbers integer[], configured_race_chart_version text, configured_playoff_team_count integer, configured_playoff_anchor_tiebreaker boolean, configured_purpose text DEFAULT 'league'::text)
 RETURNS TABLE(id uuid, name text, status text, league_night text, first_round_date date, roster_lock_round integer, opening_block_length integer, individual_min_matches integer, round_interval_days integer, default_table_numbers integer[], race_chart_version text, playoff_team_count integer, playoff_anchor_tiebreaker boolean, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  created_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists (select 1 from jfl_private.league_admins la where la.user_id=actor_user_id) then
    raise exception 'Actor is not a league admin';
  end if;
  if configured_purpose is null or configured_purpose not in ('league','qa') then raise exception 'Invalid season purpose'; end if;
  -- Insert a distinct registration season first; the existing explicit-target validator/configurator
  -- owns all setup rules and audit. Any failed validation rolls back this insert.
  insert into jfl.seasons(name,status,purpose) values(configured_season_name,'registration',configured_purpose)
    returning seasons.id into created_id;
  return query select * from jfl.configure_season_setup(
    actor_user_id,created_id,configured_season_name,configured_league_night,
    configured_first_round_date,configured_roster_lock_round,configured_opening_block_length,
    configured_individual_min_matches,configured_round_interval_days,configured_table_numbers,
    configured_race_chart_version,configured_playoff_team_count,configured_playoff_anchor_tiebreaker);
end;
$function$
;
CREATE OR REPLACE FUNCTION jfl.get_season_setup(actor_user_id uuid, target_season_id uuid)
 RETURNS TABLE(id uuid, name text, status text, league_night text, first_round_date date, roster_lock_round integer, opening_block_length integer, individual_min_matches integer, round_interval_days integer, default_table_numbers integer[], race_chart_version text, playoff_team_count integer, playoff_anchor_tiebreaker boolean, teams jsonb, rounds jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  if not exists (
    select 1
    from jfl_private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  return query
  select
    s.id,
    s.name,
    s.status,
    s.league_night,
    s.first_round_date,
    s.roster_lock_round,
    s.opening_block_length,
    s.individual_min_matches,
    s.round_interval_days,
    s.default_table_numbers,
    s.race_chart_version,
    s.playoff_team_count,
    s.playoff_anchor_tiebreaker,
    coalesce(team_rows.teams, '[]'::jsonb) as teams,
    coalesce(round_rows.rounds, '[]'::jsonb) as rounds
  from jfl.seasons s
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'teamId', t.id,
        'teamName', t.name,
        'activeRosterCount', coalesce(roster_rows.active_roster_count, 0)
      )
      order by t.name
    ) as teams
    from jfl.teams t
    left join lateral (
      select count(*)::integer as active_roster_count
      from jfl.team_memberships tm
      where tm.team_id = t.id
        and tm.ends_at is null
    ) roster_rows on true
    where t.season_id = s.id
  ) team_rows on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'roundId', r.id,
        'roundNumber', r.round_number,
        'stage', r.stage,
        'scheduledOn', r.scheduled_on,
        'matches', coalesce(match_rows.matches, '[]'::jsonb)
      )
      order by r.stage, r.round_number
    ) as rounds
    from jfl.rounds r
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'teamMatchId', tm.id,
          'tableNumber', tm.table_number,
          'teamAId', tm.team_a_id,
          'teamAName', team_a.name,
          'teamBId', tm.team_b_id,
          'teamBName', team_b.name
        )
        order by tm.table_number
      ) as matches
      from jfl.team_matches tm
      join jfl.teams team_a on team_a.id = tm.team_a_id
      join jfl.teams team_b on team_b.id = tm.team_b_id
      where tm.round_id = r.id
    ) match_rows on true
    where r.season_id = s.id
  ) round_rows on true
  where s.id = target_season_id;
end;
$function$
;

