create table private.captaincy_transfers (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null,
  from_player_id uuid not null references public.players(id) on delete cascade,
  to_player_id uuid not null references public.players(id) on delete cascade,
  departure_mode text not null default 'remain'
    check (departure_mode in ('remain','leave')),
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  check (from_player_id <> to_player_id)
);

alter table private.captaincy_transfers enable row level security;
revoke all on private.captaincy_transfers from public, anon, authenticated;

create unique index one_pending_captaincy_transfer_per_team
  on private.captaincy_transfers (season_id, team_id)
  where status = 'pending';

create unique index if not exists one_active_captain_team_per_season
  on public.team_memberships (season_id, player_id)
  where role = 'captain' and ends_at is null;

create or replace function public.create_team_with_captain(
  actor_user_id uuid,
  target_season_id uuid,
  team_name text
)
returns table(id uuid, season_id uuid, name text, captain_player_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  inserted_team_id uuid;
  normalized_team_name text;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  normalized_team_name := btrim(team_name);
  if normalized_team_name is null or char_length(normalized_team_name) = 0 then
    raise exception 'team_name is required';
  end if;
  if char_length(normalized_team_name) > 80 then
    raise exception 'team_name must be 80 characters or fewer';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before creating a team'; end if;

  if exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.ends_at is null
  ) then
    raise exception 'You already belong to a team in this season and cannot create another';
  end if;

  insert into public.teams (season_id, name, created_by)
  values (target_season_id, normalized_team_name, actor_user_id)
  returning teams.id into inserted_team_id;

  insert into public.team_memberships (season_id, team_id, player_id, role)
  values (target_season_id, inserted_team_id, actor_player_id, 'captain');

  return query
  select t.id, t.season_id, t.name, actor_player_id
  from public.teams t
  where t.id = inserted_team_id;
end;
$$;

create or replace function public.request_captaincy_transfer(
  actor_user_id uuid,
  target_team_id uuid,
  target_player_id uuid,
  requested_departure_mode text default 'remain'
)
returns table(
  id uuid,
  season_id uuid,
  team_id uuid,
  from_player_id uuid,
  to_player_id uuid,
  departure_mode text,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  transfer_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;
  if requested_departure_mode not in ('remain','leave') then
    raise exception 'departure_mode must be remain or leave';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;

  select t.season_id into target_season_id
  from public.teams t
  where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can transfer captaincy';
  end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.season_id = target_season_id
      and tm.player_id = target_player_id
      and tm.role = 'player'
      and tm.ends_at is null
  ) then
    raise exception 'New captain must be an active rostered player on this team';
  end if;

  insert into private.captaincy_transfers(
    season_id, team_id, from_player_id, to_player_id, departure_mode
  ) values (
    target_season_id, target_team_id, actor_player_id, target_player_id, requested_departure_mode
  ) returning private.captaincy_transfers.id into transfer_id;

  return query
  select ct.id, ct.season_id, ct.team_id, ct.from_player_id, ct.to_player_id,
         ct.departure_mode, ct.status
  from private.captaincy_transfers ct
  where ct.id = transfer_id;
end;
$$;

create or replace function public.respond_to_captaincy_transfer(
  actor_user_id uuid,
  target_transfer_id uuid,
  response_status text
)
returns table(
  id uuid,
  season_id uuid,
  team_id uuid,
  from_player_id uuid,
  to_player_id uuid,
  departure_mode text,
  status text,
  resolved_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  transfer_row private.captaincy_transfers%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_transfer_id is null then raise exception 'target_transfer_id is required'; end if;
  if response_status not in ('accepted','declined') then
    raise exception 'response_status must be accepted or declined';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;

  select * into transfer_row
  from private.captaincy_transfers ct
  where ct.id = target_transfer_id
  for update;
  if not found then raise exception 'Captaincy transfer not found'; end if;
  if transfer_row.status <> 'pending' then raise exception 'Captaincy transfer is no longer pending'; end if;
  if transfer_row.to_player_id <> actor_player_id then
    raise exception 'Only the proposed captain can respond to this transfer';
  end if;

  if response_status = 'accepted' then
    if not exists (
      select 1 from public.team_memberships tm
      where tm.team_id = transfer_row.team_id
        and tm.season_id = transfer_row.season_id
        and tm.player_id = transfer_row.from_player_id
        and tm.role = 'captain'
        and tm.ends_at is null
    ) then
      raise exception 'Current captain is no longer eligible to transfer this team';
    end if;

    if not exists (
      select 1 from public.team_memberships tm
      where tm.team_id = transfer_row.team_id
        and tm.season_id = transfer_row.season_id
        and tm.player_id = transfer_row.to_player_id
        and tm.role = 'player'
        and tm.ends_at is null
    ) then
      raise exception 'Proposed captain is no longer an active rostered player';
    end if;

    update public.team_memberships
    set role = 'captain'
    where season_id = transfer_row.season_id
      and team_id = transfer_row.team_id
      and player_id = transfer_row.to_player_id
      and ends_at is null;

    if transfer_row.departure_mode = 'leave' then
      update public.team_memberships
      set ends_at = now()
      where season_id = transfer_row.season_id
        and team_id = transfer_row.team_id
        and player_id = transfer_row.from_player_id
        and role = 'captain'
        and ends_at is null;
    else
      update public.team_memberships
      set role = 'player'
      where season_id = transfer_row.season_id
        and team_id = transfer_row.team_id
        and player_id = transfer_row.from_player_id
        and role = 'captain'
        and ends_at is null;
    end if;
  end if;

  update private.captaincy_transfers
  set status = response_status,
      resolved_at = now()
  where private.captaincy_transfers.id = target_transfer_id;

  return query
  select ct.id, ct.season_id, ct.team_id, ct.from_player_id, ct.to_player_id,
         ct.departure_mode, ct.status, ct.resolved_at
  from private.captaincy_transfers ct
  where ct.id = target_transfer_id;
end;
$$;

create or replace function public.cancel_captaincy_transfer(
  actor_user_id uuid,
  target_transfer_id uuid
)
returns table(id uuid, status text, resolved_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  transfer_row private.captaincy_transfers%rowtype;
begin
  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;

  select * into transfer_row
  from private.captaincy_transfers ct
  where ct.id = target_transfer_id
  for update;
  if not found then raise exception 'Captaincy transfer not found'; end if;
  if transfer_row.status <> 'pending' then raise exception 'Captaincy transfer is no longer pending'; end if;
  if transfer_row.from_player_id <> actor_player_id then
    raise exception 'Only the current captain can cancel this transfer';
  end if;

  update private.captaincy_transfers
  set status = 'cancelled', resolved_at = now()
  where private.captaincy_transfers.id = target_transfer_id;

  return query
  select ct.id, ct.status, ct.resolved_at
  from private.captaincy_transfers ct
  where ct.id = target_transfer_id;
end;
$$;

create or replace function public.get_own_captaincy_transfers(actor_user_id uuid)
returns table(outgoing jsonb, incoming jsonb)
language sql
stable
security definer
set search_path = ''
as $$
with actor_player as (
  select p.id from public.players p where p.user_id = actor_user_id limit 1
),
outgoing_rows as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'transferId', ct.id,
    'teamId', ct.team_id,
    'teamName', t.name,
    'seasonId', ct.season_id,
    'seasonName', s.name,
    'toPlayerId', ct.to_player_id,
    'toDisplayName', p.display_name,
    'departureMode', ct.departure_mode,
    'status', ct.status,
    'createdAt', ct.created_at
  ) order by ct.created_at desc), '[]'::jsonb) as rows
  from actor_player ap
  join private.captaincy_transfers ct on ct.from_player_id = ap.id
  join public.teams t on t.id = ct.team_id and t.season_id = ct.season_id
  join public.seasons s on s.id = ct.season_id
  join public.players p on p.id = ct.to_player_id
  where ct.status = 'pending'
),
incoming_rows as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'transferId', ct.id,
    'teamId', ct.team_id,
    'teamName', t.name,
    'seasonId', ct.season_id,
    'seasonName', s.name,
    'fromPlayerId', ct.from_player_id,
    'fromDisplayName', p.display_name,
    'departureMode', ct.departure_mode,
    'status', ct.status,
    'createdAt', ct.created_at
  ) order by ct.created_at desc), '[]'::jsonb) as rows
  from actor_player ap
  join private.captaincy_transfers ct on ct.to_player_id = ap.id
  join public.teams t on t.id = ct.team_id and t.season_id = ct.season_id
  join public.seasons s on s.id = ct.season_id
  join public.players p on p.id = ct.from_player_id
  where ct.status = 'pending'
)
select outgoing_rows.rows, incoming_rows.rows
from outgoing_rows cross join incoming_rows;
$$;

revoke all on function public.create_team_with_captain(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.request_captaincy_transfer(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.respond_to_captaincy_transfer(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.cancel_captaincy_transfer(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_own_captaincy_transfers(uuid) from public, anon, authenticated;
grant execute on function public.create_team_with_captain(uuid, uuid, text) to service_role;
grant execute on function public.request_captaincy_transfer(uuid, uuid, uuid, text) to service_role;
grant execute on function public.respond_to_captaincy_transfer(uuid, uuid, text) to service_role;
grant execute on function public.cancel_captaincy_transfer(uuid, uuid) to service_role;
grant execute on function public.get_own_captaincy_transfers(uuid) to service_role;
