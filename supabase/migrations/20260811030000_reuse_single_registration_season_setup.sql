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
returns table(
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
set search_path to ''
as $function$
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
    lock table public.seasons in share row exclusive mode;

    select count(*)::integer
      into registration_season_count
    from public.seasons s
    where s.status = 'registration';

    if registration_season_count > 1 then
      raise exception 'Multiple registration seasons exist; choose a season before saving setup';
    end if;

    if registration_season_count = 1 then
      select s.id
        into target_season_id
      from public.seasons s
      where s.status = 'registration'
      limit 1;
    end if;
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
$function$;
