create table if not exists private.player_date_availability (
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  availability_date date not null,
  status text not null check (status in ('available', 'unsure', 'unavailable')),
  updated_at timestamptz not null default now(),
  primary key (season_id, player_id, availability_date)
);

alter table private.player_date_availability enable row level security;

create or replace function public.get_own_date_availability(
  actor_user_id uuid,
  target_season_id uuid,
  target_availability_date date
)
returns table (
  season_id uuid,
  player_id uuid,
  availability_date date,
  availability_status text,
  registered boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_player_id uuid;
  is_registered boolean;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if target_availability_date is null then raise exception 'target_availability_date is required'; end if;

  select p.id into target_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if target_player_id is null then
    raise exception 'Player profile is required';
  end if;

  select exists (
    select 1
    from public.season_players sp
    where sp.season_id = target_season_id
      and sp.player_id = target_player_id
      and sp.status = 'active'
  ) into is_registered;

  return query
  select
    target_season_id,
    target_player_id,
    target_availability_date,
    coalesce(pda.status, 'unsure'::text),
    is_registered,
    pda.updated_at
  from (select 1) seed
  left join private.player_date_availability pda
    on pda.season_id = target_season_id
   and pda.player_id = target_player_id
   and pda.availability_date = target_availability_date;
end;
$$;

create or replace function public.set_own_date_availability(
  actor_user_id uuid,
  target_season_id uuid,
  target_availability_date date,
  availability_status text
)
returns table (
  season_id uuid,
  player_id uuid,
  availability_date date,
  availability_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if target_availability_date is null then raise exception 'target_availability_date is required'; end if;
  if availability_status not in ('available', 'unsure', 'unavailable') then
    raise exception 'availability_status must be available, unsure, or unavailable';
  end if;

  select p.id into target_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if target_player_id is null then raise exception 'Player profile is required'; end if;

  if not exists (
    select 1
    from public.season_players sp
    where sp.season_id = target_season_id
      and sp.player_id = target_player_id
      and sp.status = 'active'
  ) then
    raise exception 'Active season registration is required to set availability';
  end if;

  if not exists (
    select 1
    from public.rounds r
    where r.season_id = target_season_id
      and r.scheduled_on = target_availability_date
  ) then
    raise exception 'Availability date is not a scheduled league date for this season';
  end if;

  insert into private.player_date_availability(
    season_id,
    player_id,
    availability_date,
    status,
    updated_at
  ) values (
    target_season_id,
    target_player_id,
    target_availability_date,
    availability_status,
    now()
  )
  on conflict on constraint player_date_availability_pkey do update
  set status = excluded.status,
      updated_at = now();

  return query
  select pda.season_id, pda.player_id, pda.availability_date, pda.status, pda.updated_at
  from private.player_date_availability pda
  where pda.season_id = target_season_id
    and pda.player_id = target_player_id
    and pda.availability_date = target_availability_date;
end;
$$;

revoke all on function public.get_own_date_availability(uuid, uuid, date)
  from public, anon, authenticated;
grant execute on function public.get_own_date_availability(uuid, uuid, date)
  to service_role;

revoke all on function public.set_own_date_availability(uuid, uuid, date, text)
  from public, anon, authenticated;
grant execute on function public.set_own_date_availability(uuid, uuid, date, text)
  to service_role;

comment on table private.player_date_availability is
  'One personal availability check-in per registered player, season, and calendar date. Missing rows mean unsure.';
comment on function public.get_own_date_availability(uuid, uuid, date) is
  'Service-role-only read of the authenticated actor player date-wide availability. Missing response is unsure.';
comment on function public.set_own_date_availability(uuid, uuid, date, text) is
  'Service-role-only write of the authenticated actor player date-wide availability for a scheduled league date.';
