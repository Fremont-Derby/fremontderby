create or replace function private.guard_explicit_season_close()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'complete'
     and old.status is distinct from 'complete'
     and coalesce(current_setting('fremont.explicit_season_close', true), '') <> 'on' then
    -- Postseason scoring may finish the championship, but only the explicit
    -- league-admin close command owns the season lifecycle transition.
    new.status := old.status;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_explicit_season_close() from public, anon, authenticated;
grant execute on function private.guard_explicit_season_close() to service_role;

drop trigger if exists guard_explicit_season_close on public.seasons;
create trigger guard_explicit_season_close
before update of status on public.seasons
for each row
execute function private.guard_explicit_season_close();

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
  unresolved_postseason integer;
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
         count(*) filter (where tm.status = 'finalized')::integer
  into championship_count, finalized_championship_count
  from public.rounds r
  join public.team_matches tm on tm.round_id = r.id
  where r.season_id = target_season_id
    and r.stage = 'championship';

  select count(*)::integer
  into unresolved_postseason
  from public.rounds r
  join public.team_matches tm on tm.round_id = r.id
  where r.season_id = target_season_id
    and r.stage in ('semifinal', 'championship', 'tiebreaker')
    and tm.status <> 'finalized';

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
    unresolved_postseason,
    unresolved_players,
    (
      current_status = 'complete'
      or (
        current_status = 'playoffs'
        and championship_count = 1
        and finalized_championship_count = 1
        and unresolved_postseason = 0
        and unresolved_players = 0
      )
    ),
    case
      when current_status = 'complete' then 'Season is already closed.'
      when current_status <> 'playoffs' then 'Finish the regular season and postseason before closing.'
      when championship_count = 0 then 'Championship must be created before closing.'
      when championship_count <> 1 then 'Exactly one championship matchup is required before closing.'
      when finalized_championship_count <> 1 then 'Championship must be finalized before closing.'
      when unresolved_postseason > 0 then 'Postseason still has unresolved matchups.'
      when unresolved_players > 0 then 'Competitive player matches still need final scores.'
      else 'All competition is finalized. Season is ready to close.'
    end;
end;
$$;

create or replace function public.close_season(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  season_id uuid,
  season_status text,
  closed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  readiness record;
  effective_closed_at timestamptz := now();
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;

  perform 1
  from public.seasons s
  where s.id = target_season_id
  for update;

  if not found then raise exception 'Season not found'; end if;

  select * into readiness
  from public.get_season_close_readiness(actor_user_id, target_season_id);

  if readiness.season_status = 'complete' then
    return query select target_season_id, 'complete'::text, effective_closed_at;
    return;
  end if;

  if not readiness.ready then
    raise exception '%', readiness.reason;
  end if;

  perform set_config('fremont.explicit_season_close', 'on', true);

  update public.seasons
  set status = 'complete',
      updated_at = effective_closed_at
  where id = target_season_id;

  insert into private.audit_events(
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_state
  ) values (
    actor_user_id,
    'season.close',
    'season',
    target_season_id,
    jsonb_build_object(
      'status', 'complete',
      'closedAt', effective_closed_at,
      'championshipFinalized', readiness.championship_finalized,
      'unresolvedPostseasonMatches', readiness.unresolved_postseason_matches,
      'unresolvedPlayerMatches', readiness.unresolved_player_matches
    )
  );

  return query select target_season_id, 'complete'::text, effective_closed_at;
end;
$$;

revoke all on function public.get_season_close_readiness(uuid, uuid)
from public, anon, authenticated;
revoke all on function public.close_season(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.get_season_close_readiness(uuid, uuid) to service_role;
grant execute on function public.close_season(uuid, uuid) to service_role;

comment on function public.get_season_close_readiness(uuid, uuid) is
  'Service-role-only league-admin readiness for deliberate season closure after finalized postseason competition.';
comment on function public.close_season(uuid, uuid) is
  'Service-role-only audited league-admin season close. Preserves all competition/history and owns the transition to complete.';
