-- A public league season may only become complete after every competitive
-- team matchup is resolved. QA seasons may intentionally preserve partial
-- fixtures, but are isolated from public league surfaces by season purpose.

create or replace function private.guard_explicit_season_close()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'complete' and old.status is distinct from 'complete' then
    if coalesce(new.purpose, 'league') = 'league'
       and exists (
         select 1
         from public.rounds r
         join public.team_matches tm on tm.round_id = r.id
         where r.season_id = new.id
           and tm.status not in ('finalized', 'corrected')
       ) then
      raise exception 'Competitive team matchups still need final results before closing the season';
    end if;

    if coalesce(current_setting('fremont.explicit_season_close', true), '') <> 'on' then
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.get_season_close_readiness(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  season_id uuid,
  season_status text,
  championship_exists boolean,
  championship_finalized boolean,
  unresolved_postseason_matches integer,
  unresolved_player_matches integer,
  ready boolean,
  reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  championship_count integer;
  finalized_championship_count integer;
  unresolved_competitive_team_matches integer;
  unresolved_players integer;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  select s.status into current_status
  from public.seasons s
  where s.id = target_season_id;

  if current_status is null then
    raise exception 'Season not found';
  end if;

  select count(*)::integer,
         count(*) filter (where tm.status in ('finalized', 'corrected'))::integer
  into championship_count, finalized_championship_count
  from public.rounds r
  join public.team_matches tm on tm.round_id = r.id
  where r.season_id = target_season_id
    and r.stage = 'championship';

  -- Keep the existing output field name for API compatibility, but count all
  -- competitive team matchups so regular-season gaps also block closure.
  select count(*)::integer
  into unresolved_competitive_team_matches
  from public.rounds r
  join public.team_matches tm on tm.round_id = r.id
  where r.season_id = target_season_id
    and tm.status not in ('finalized', 'corrected');

  select count(*)::integer
  into unresolved_players
  from public.player_matches pm
  where pm.season_id = target_season_id
    and pm.status not in ('finalized', 'corrected');

  return query
  select
    target_season_id,
    current_status,
    championship_count > 0,
    championship_count = 1 and finalized_championship_count = 1,
    unresolved_competitive_team_matches,
    unresolved_players,
    (
      current_status = 'complete'
      or (
        current_status = 'playoffs'
        and championship_count = 1
        and finalized_championship_count = 1
        and unresolved_competitive_team_matches = 0
        and unresolved_players = 0
      )
    ),
    case
      when current_status = 'complete' then 'Season is already closed.'
      when current_status <> 'playoffs' then 'Finish the regular season and postseason before closing.'
      when championship_count = 0 then 'Championship must be created before closing.'
      when championship_count <> 1 then 'Exactly one championship matchup is required before closing.'
      when finalized_championship_count <> 1 then 'Championship must be finalized before closing.'
      when unresolved_competitive_team_matches > 0 then 'Competitive team matchups still have unresolved results.'
      when unresolved_players > 0 then 'Competitive player matches still need final scores.'
      else 'All competition is finalized. Season is ready to close.'
    end;
end;
$$;

comment on function public.get_season_close_readiness(uuid, uuid) is
  'Service-role-only league-admin readiness for deliberate season closure after every competitive team and player match is resolved.';
