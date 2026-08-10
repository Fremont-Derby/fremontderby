create table public.season_players (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  participation_type text not null
    check (participation_type in ('rostered', 'free_agent')),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (season_id, player_id)
);

create table private.free_agent_availability (
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_id uuid not null,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null
    check (status in ('available', 'unavailable', 'unsure')),
  updated_at timestamptz not null default now(),
  primary key (round_id, player_id),
  foreign key (round_id, season_id)
    references public.rounds(id, season_id)
    on delete cascade,
  foreign key (season_id, player_id)
    references public.season_players(season_id, player_id)
    on delete cascade
);

alter table public.season_players enable row level security;

grant select on public.season_players to anon, authenticated;
grant all on public.season_players to service_role;
revoke all on table private.free_agent_availability from public, anon, authenticated;
grant all on table private.free_agent_availability to service_role;

create policy "Season players are publicly readable"
on public.season_players for select
to anon, authenticated
using (true);

create or replace function public.register_free_agent(
  actor_user_id uuid,
  target_season_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  player_id uuid,
  participation_type text,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before joining as a free agent';
  end if;

  if exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.ends_at is null
  ) then
    raise exception 'Rostered players cannot register as free agents for the same season';
  end if;

  return query
  insert into public.season_players (
    season_id,
    player_id,
    participation_type,
    status
  ) values (
    target_season_id,
    actor_player_id,
    'free_agent',
    'active'
  )
  on conflict (season_id, player_id) do update
    set participation_type = 'free_agent',
        status = 'active'
  returning
    season_players.id,
    season_players.season_id,
    season_players.player_id,
    season_players.participation_type,
    season_players.status;
end;
$$;

create or replace function public.set_free_agent_availability(
  actor_user_id uuid,
  target_round_id uuid,
  availability_status text
)
returns table (
  season_id uuid,
  round_id uuid,
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
    raise exception 'Player profile is required before setting availability';
  end if;

  select r.season_id
    into target_season_id
  from public.rounds r
  where r.id = target_round_id;

  if not found then
    raise exception 'Round not found';
  end if;

  if not exists (
    select 1
    from public.season_players sp
    where sp.season_id = target_season_id
      and sp.player_id = actor_player_id
      and sp.participation_type = 'free_agent'
      and sp.status = 'active'
  ) then
    raise exception 'Active free-agent registration is required before setting availability';
  end if;

  return query
  insert into private.free_agent_availability (
    season_id,
    round_id,
    player_id,
    status
  ) values (
    target_season_id,
    target_round_id,
    actor_player_id,
    availability_status
  )
  on conflict (round_id, player_id) do update
    set status = excluded.status,
        updated_at = now()
  returning
    free_agent_availability.season_id,
    free_agent_availability.round_id,
    free_agent_availability.player_id,
    free_agent_availability.status,
    free_agent_availability.updated_at;
end;
$$;

revoke all on function public.register_free_agent(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.register_free_agent(uuid, uuid)
  to service_role;

revoke all on function public.set_free_agent_availability(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_free_agent_availability(uuid, uuid, text)
  to service_role;

comment on table public.season_players is
  'Season participation, including free agents. Browser roles may read participation; trusted commands manage writes.';

comment on table private.free_agent_availability is
  'Private free-agent availability by round. Captains see eligible availability only through trusted read models.';

comment on function public.register_free_agent(uuid, uuid) is
  'Service-role-only self-service boundary for registering the authenticated actor as a season free agent.';

comment on function public.set_free_agent_availability(uuid, uuid, text) is
  'Service-role-only self-service boundary for the authenticated free agent to set round availability.';
