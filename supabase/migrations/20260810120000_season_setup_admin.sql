alter table public.seasons
  add column if not exists league_night text not null default 'Thursday'
    check (char_length(league_night) between 1 and 40),
  add column if not exists first_round_date date,
  add column if not exists round_interval_days integer not null default 7
    check (round_interval_days > 0),
  add column if not exists default_table_numbers integer[] not null default array[1, 2, 3, 4],
  add column if not exists race_chart_version text not null default 'season-1-default'
    check (char_length(race_chart_version) between 1 and 80),
  add column if not exists playoff_team_count integer not null default 4
    check (playoff_team_count > 0),
  add column if not exists playoff_anchor_tiebreaker boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add constraint seasons_default_table_numbers_shape
    check (array_length(default_table_numbers, 1) = 4);

create or replace function private.validate_season_setup_table_numbers(table_numbers integer[])
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
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
$$;

revoke all on function private.validate_season_setup_table_numbers(integer[]) from public;

create or replace function public.configure_season_setup(
  actor_user_id uuid,
  target_season_id uuid,
  configured_season_name text,
  configured_league_night text,
  configured_first_round_date date,
  configured_roster_lock_round integer,
  configured_opening_block_length integer,
  configured_individual_min_matches integer,
  configured_round_interval_days integer,
  configured_table_numbers integer[],
  configured_race_chart_version text,
  configured_playoff_team_count integer,
  configured_playoff_anchor_tiebreaker boolean
)
returns table (
  id uuid,
  name text,
  status text,
  league_night text,
  first_round_date date,
  roster_lock_round integer,
  opening_block_length integer,
  individual_min_matches integer,
  round_interval_days integer,
  default_table_numbers integer[],
  race_chart_version text,
  playoff_team_count integer,
  playoff_anchor_tiebreaker boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text;
  normalized_league_night text;
  normalized_race_chart_version text;
  before_state jsonb;
  configured_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if not exists (
    select 1
    from private.league_admins la
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

  if not private.validate_season_setup_table_numbers(configured_table_numbers) then
    raise exception 'table_numbers must contain four unique positive integers';
  end if;

  if configured_playoff_team_count is null or configured_playoff_team_count < 2 then
    raise exception 'playoff_team_count must be at least two';
  end if;

  if target_season_id is null then
    insert into public.seasons (
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
    from public.seasons s
    where s.id = target_season_id
    for update;

    if not found then
      raise exception 'Season not found';
    end if;

    if not exists (
      select 1
      from public.seasons s
      where s.id = target_season_id
        and s.status in ('draft', 'registration')
    ) then
      raise exception 'Season setup can only change before publication';
    end if;

    update public.seasons
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

  insert into private.audit_events (
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
  from public.seasons s
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
  from public.seasons s
  where s.id = configured_id;
end;
$$;

create or replace function public.get_season_setup(
  actor_user_id uuid,
  target_season_id uuid
)
returns table (
  id uuid,
  name text,
  status text,
  league_night text,
  first_round_date date,
  roster_lock_round integer,
  opening_block_length integer,
  individual_min_matches integer,
  round_interval_days integer,
  default_table_numbers integer[],
  race_chart_version text,
  playoff_team_count integer,
  playoff_anchor_tiebreaker boolean,
  teams jsonb,
  rounds jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  if not exists (
    select 1
    from private.league_admins la
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
  from public.seasons s
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'teamId', t.id,
        'teamName', t.name,
        'activeRosterCount', coalesce(roster_rows.active_roster_count, 0)
      )
      order by t.name
    ) as teams
    from public.teams t
    left join lateral (
      select count(*)::integer as active_roster_count
      from public.team_memberships tm
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
    from public.rounds r
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
      from public.team_matches tm
      join public.teams team_a on team_a.id = tm.team_a_id
      join public.teams team_b on team_b.id = tm.team_b_id
      where tm.round_id = r.id
    ) match_rows on true
    where r.season_id = s.id
  ) round_rows on true
  where s.id = target_season_id;
end;
$$;

revoke all on function public.configure_season_setup(uuid, uuid, text, text, date, integer, integer, integer, integer, integer[], text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.configure_season_setup(uuid, uuid, text, text, date, integer, integer, integer, integer, integer[], text, integer, boolean)
  to service_role;

revoke all on function public.get_season_setup(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_season_setup(uuid, uuid)
  to service_role;

comment on function public.configure_season_setup(uuid, uuid, text, text, date, integer, integer, integer, integer, integer[], text, integer, boolean) is
  'Service-role-only admin boundary for creating or updating pre-publication season setup.';

comment on function public.get_season_setup(uuid, uuid) is
  'Service-role-only admin read model for setup, team count, and published schedule review.';
