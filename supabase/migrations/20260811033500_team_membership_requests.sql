create table private.team_membership_requests (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','approved','declined','cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references auth.users(id),
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade
);

alter table private.team_membership_requests enable row level security;
revoke all on private.team_membership_requests from public, anon, authenticated;

create unique index one_pending_membership_request_per_team
  on private.team_membership_requests (season_id, team_id, player_id)
  where status = 'pending';

create or replace function public.request_team_membership(
  actor_user_id uuid,
  target_team_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  team_id uuid,
  player_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  request_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before requesting a team'; end if;

  select t.season_id into target_season_id
  from public.teams t
  where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.ends_at is null
  ) then
    raise exception 'Player already has an active team membership';
  end if;

  if exists (
    select 1 from private.team_membership_requests r
    where r.season_id = target_season_id
      and r.team_id = target_team_id
      and r.player_id = actor_player_id
      and r.status = 'pending'
  ) then
    raise exception 'Membership request is already pending';
  end if;

  insert into private.team_membership_requests(season_id, team_id, player_id)
  values(target_season_id, target_team_id, actor_player_id)
  returning private.team_membership_requests.id into request_id;

  return query
  select r.id, r.season_id, r.team_id, r.player_id, r.status, r.created_at
  from private.team_membership_requests r
  where r.id = request_id;
end;
$$;

create or replace function public.respond_to_team_membership_request(
  actor_user_id uuid,
  target_request_id uuid,
  response_status text
)
returns table (
  id uuid,
  season_id uuid,
  team_id uuid,
  player_id uuid,
  status text,
  resolved_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row private.team_membership_requests%rowtype;
  actor_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_request_id is null then raise exception 'target_request_id is required'; end if;
  if response_status not in ('approved','declined') then
    raise exception 'response_status must be approved or declined';
  end if;

  select * into request_row
  from private.team_membership_requests r
  where r.id = target_request_id
  for update;
  if not found then raise exception 'Membership request not found'; end if;
  if request_row.status <> 'pending' then raise exception 'Membership request is no longer pending'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = request_row.team_id
      and tm.season_id = request_row.season_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can respond to membership requests';
  end if;

  if response_status = 'approved' then
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = request_row.season_id
        and tm.player_id = request_row.player_id
        and tm.ends_at is null
    ) then
      raise exception 'Player already has an active team membership';
    end if;

    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(request_row.season_id, request_row.team_id, request_row.player_id, 'player');
  end if;

  update private.team_membership_requests
  set status = response_status,
      resolved_at = now(),
      resolved_by_user_id = actor_user_id
  where private.team_membership_requests.id = target_request_id;

  return query
  select r.id, r.season_id, r.team_id, r.player_id, r.status, r.resolved_at
  from private.team_membership_requests r
  where r.id = target_request_id;
end;
$$;

create or replace function public.cancel_team_membership_request(
  actor_user_id uuid,
  target_request_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  team_id uuid,
  player_id uuid,
  status text,
  resolved_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row private.team_membership_requests%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_request_id is null then raise exception 'target_request_id is required'; end if;

  select * into request_row
  from private.team_membership_requests r
  where r.id = target_request_id
  for update;
  if not found then raise exception 'Membership request not found'; end if;
  if request_row.status <> 'pending' then raise exception 'Membership request is no longer pending'; end if;
  if not exists (
    select 1 from public.players p
    where p.id = request_row.player_id
      and p.user_id = actor_user_id
  ) then
    raise exception 'Only the requesting player can cancel this membership request';
  end if;

  update private.team_membership_requests
  set status = 'cancelled',
      resolved_at = now(),
      resolved_by_user_id = actor_user_id
  where private.team_membership_requests.id = target_request_id;

  return query
  select r.id, r.season_id, r.team_id, r.player_id, r.status, r.resolved_at
  from private.team_membership_requests r
  where r.id = target_request_id;
end;
$$;

create or replace function public.get_own_team_membership_requests(actor_user_id uuid)
returns table (
  player_requests jsonb,
  captain_requests jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
with actor_player as (
  select p.id
  from public.players p
  where p.user_id = actor_user_id
  limit 1
),
player_rows as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'requestId', r.id,
    'seasonId', r.season_id,
    'seasonName', s.name,
    'teamId', r.team_id,
    'teamName', t.name,
    'status', r.status,
    'createdAt', r.created_at,
    'resolvedAt', r.resolved_at
  ) order by r.created_at desc), '[]'::jsonb) as rows
  from actor_player ap
  join private.team_membership_requests r on r.player_id = ap.id
  join public.teams t on t.id = r.team_id and t.season_id = r.season_id
  join public.seasons s on s.id = r.season_id
),
captain_team_ids as (
  select tm.team_id, tm.season_id
  from actor_player ap
  join public.team_memberships tm on tm.player_id = ap.id
  where tm.role = 'captain' and tm.ends_at is null
),
captain_rows as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'requestId', r.id,
    'seasonId', r.season_id,
    'seasonName', s.name,
    'teamId', r.team_id,
    'teamName', t.name,
    'playerId', p.id,
    'displayName', p.display_name,
    'status', r.status,
    'createdAt', r.created_at
  ) order by r.created_at), '[]'::jsonb) as rows
  from captain_team_ids c
  join private.team_membership_requests r
    on r.team_id = c.team_id and r.season_id = c.season_id and r.status = 'pending'
  join public.teams t on t.id = r.team_id and t.season_id = r.season_id
  join public.seasons s on s.id = r.season_id
  join public.players p on p.id = r.player_id
)
select player_rows.rows, captain_rows.rows
from player_rows cross join captain_rows;
$$;

revoke all on function public.request_team_membership(uuid, uuid) from public, anon, authenticated;
revoke all on function public.respond_to_team_membership_request(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.cancel_team_membership_request(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_own_team_membership_requests(uuid) from public, anon, authenticated;
grant execute on function public.request_team_membership(uuid, uuid) to service_role;
grant execute on function public.respond_to_team_membership_request(uuid, uuid, text) to service_role;
grant execute on function public.cancel_team_membership_request(uuid, uuid) to service_role;
grant execute on function public.get_own_team_membership_requests(uuid) to service_role;
