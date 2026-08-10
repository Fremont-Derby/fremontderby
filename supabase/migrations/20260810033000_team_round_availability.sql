create table private.roster_availability (
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_id uuid not null,
  team_id uuid not null,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null
    check (status in ('available', 'unavailable', 'unsure')),
  updated_at timestamptz not null default now(),
  primary key (round_id, player_id),
  foreign key (round_id, season_id)
    references public.rounds(id, season_id)
    on delete cascade,
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade
);

create index roster_availability_team_round_idx
  on private.roster_availability (round_id, team_id);

revoke all on table private.roster_availability from public, anon, authenticated;
grant all on table private.roster_availability to service_role;

create or replace function public.set_roster_availability(
  actor_user_id uuid,
  target_round_id uuid,
  availability_status text
)
returns table (
  season_id uuid,
  round_id uuid,
  team_id uuid,
  player_id uuid,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  actor_team_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_round_id is null then
    raise exception 'target_round_id is required';
  end if;

  if availability_status not in ('available', 'unavailable', 'unsure') then
    raise exception 'availability_status must be available, unavailable, or unsure';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before setting roster availability';
  end if;

  select r.season_id
    into target_season_id
  from public.rounds r
  where r.id = target_round_id;

  if not found then
    raise exception 'Round not found';
  end if;

  select tm.team_id
    into actor_team_id
  from public.team_memberships tm
  where tm.season_id = target_season_id
    and tm.player_id = actor_player_id
    and tm.ends_at is null;

  if not found then
    raise exception 'Active roster membership is required before setting availability';
  end if;

  return query
  insert into private.roster_availability (
    season_id,
    round_id,
    team_id,
    player_id,
    status
  ) values (
    target_season_id,
    target_round_id,
    actor_team_id,
    actor_player_id,
    availability_status
  )
  on conflict (round_id, player_id) do update
    set status = excluded.status,
        team_id = excluded.team_id,
        updated_at = now()
  returning
    roster_availability.season_id,
    roster_availability.round_id,
    roster_availability.team_id,
    roster_availability.player_id,
    roster_availability.status,
    roster_availability.updated_at;
end;
$$;

create or replace function public.list_team_round_availability(
  actor_user_id uuid,
  target_team_id uuid,
  target_round_id uuid
)
returns table (
  season_id uuid,
  round_id uuid,
  team_id uuid,
  player_id uuid,
  display_name text,
  role text,
  participation_type text,
  fargo_rating integer,
  rating_status text,
  availability_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  active_roster_count integer;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_team_id is null then
    raise exception 'target_team_id is required';
  end if;

  if target_round_id is null then
    raise exception 'target_round_id is required';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before viewing team availability';
  end if;

  select t.season_id
    into target_season_id
  from public.teams t
  where t.id = target_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  if not exists (
    select 1
    from public.rounds r
    where r.id = target_round_id
      and r.season_id = target_season_id
  ) then
    raise exception 'Round not found for team season';
  end if;

  if not exists (
    select 1
    from public.team_matches tm
    where tm.round_id = target_round_id
      and (tm.team_a_id = target_team_id or tm.team_b_id = target_team_id)
  ) then
    raise exception 'Team is not scheduled for target round';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can view team round availability';
  end if;

  select private.active_team_roster_count(target_team_id)
    into active_roster_count;

  return query
  select
    candidates.season_id,
    candidates.round_id,
    candidates.team_id,
    candidates.player_id,
    candidates.display_name,
    candidates.role,
    candidates.participation_type,
    candidates.fargo_rating,
    candidates.rating_status,
    candidates.availability_status,
    candidates.updated_at
  from (
    select
      0 as sort_order,
      tm.season_id,
      target_round_id as round_id,
      tm.team_id,
      p.id as player_id,
      p.display_name,
      tm.role,
      'roster'::text as participation_type,
      pr.fargo_rating,
      pr.rating_status,
      ra.status as availability_status,
      ra.updated_at
    from public.team_memberships tm
    join public.players p
      on p.id = tm.player_id
    left join public.player_ratings pr
      on pr.player_id = tm.player_id
    left join private.roster_availability ra
      on ra.round_id = target_round_id
     and ra.player_id = tm.player_id
    where tm.team_id = target_team_id
      and tm.season_id = target_season_id
      and tm.ends_at is null

    union all

    select
      1 as sort_order,
      sp.season_id,
      fa.round_id,
      target_team_id as team_id,
      p.id as player_id,
      p.display_name,
      null::text as role,
      'free_agent'::text as participation_type,
      pr.fargo_rating,
      pr.rating_status,
      fa.status as availability_status,
      fa.updated_at
    from private.free_agent_availability fa
    join public.season_players sp
      on sp.season_id = fa.season_id
     and sp.player_id = fa.player_id
    join public.players p
      on p.id = sp.player_id
    left join public.player_ratings pr
      on pr.player_id = sp.player_id
    where active_roster_count < 4
      and fa.round_id = target_round_id
      and fa.season_id = target_season_id
      and fa.status = 'available'
      and sp.participation_type = 'free_agent'
      and sp.status = 'active'
      and not exists (
        select 1
        from public.team_memberships active_tm
        where active_tm.season_id = target_season_id
          and active_tm.player_id = sp.player_id
          and active_tm.ends_at is null
      )
  ) candidates
  order by candidates.sort_order, lower(candidates.display_name), candidates.player_id;
end;
$$;

revoke all on function public.set_roster_availability(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_roster_availability(uuid, uuid, text)
  to service_role;

revoke all on function public.list_team_round_availability(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.list_team_round_availability(uuid, uuid, uuid)
  to service_role;

comment on table private.roster_availability is
  'Private roster-player availability by round. Captains see team availability only through trusted read models.';

comment on function public.set_roster_availability(uuid, uuid, text) is
  'Service-role-only self-service boundary for an active roster player to set round availability.';

comment on function public.list_team_round_availability(uuid, uuid, uuid) is
  'Service-role-only captain read model for primary roster availability plus eligible free agents.';
