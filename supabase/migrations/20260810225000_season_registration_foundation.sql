create or replace function public.register_for_season(
  actor_user_id uuid,
  target_season_id uuid,
  registration_participation_type text default 'free_agent'
)
returns table (
  season_id uuid,
  player_id uuid,
  participation_type text,
  registration_status text,
  registered_at timestamptz,
  payment_status text,
  amount_due_cents integer,
  amount_paid_cents integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_player public.players%rowtype;
  target_season public.seasons%rowtype;
  registration public.season_players%rowtype;
  fee_cents integer;
  has_active_team boolean;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if registration_participation_type not in ('rostered', 'free_agent') then
    raise exception 'participation_type must be rostered or free_agent';
  end if;

  select * into target_player
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before season registration'; end if;

  select * into target_season
  from public.seasons s
  where s.id = target_season_id;
  if not found then raise exception 'Season not found'; end if;
  if target_season.status <> 'registration' then raise exception 'Season registration is not open'; end if;

  select exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = target_player.id
      and tm.ends_at is null
  ) into has_active_team;

  if registration_participation_type = 'rostered' and not has_active_team then
    raise exception 'Active team membership is required for rostered registration';
  end if;
  if registration_participation_type = 'free_agent' and has_active_team then
    raise exception 'Rostered players cannot register as free agents for the same season';
  end if;

  insert into public.season_players(season_id, player_id, participation_type, status)
  values (target_season_id, target_player.id, registration_participation_type, 'active')
  on conflict (season_id, player_id) do update
    set participation_type = excluded.participation_type,
        status = 'active'
  returning * into registration;

  select coalesce(spc.entry_fee_cents, 0)
  into fee_cents
  from public.season_prize_configurations spc
  where spc.season_id = target_season_id
  order by spc.version desc
  limit 1;
  fee_cents := coalesce(fee_cents, 0);

  insert into private.payment_status(season_id, player_id, status, amount_due_cents, amount_paid_cents)
  values (target_season_id, target_player.id, 'unpaid', fee_cents, 0)
  on conflict (season_id, player_id) do nothing;

  return query
  select
    registration.season_id,
    registration.player_id,
    registration.participation_type,
    registration.status,
    registration.created_at,
    ps.status,
    ps.amount_due_cents,
    ps.amount_paid_cents
  from private.payment_status ps
  where ps.season_id = target_season_id
    and ps.player_id = target_player.id;
end;
$$;

revoke all on function public.register_for_season(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.register_for_season(uuid, uuid, text) to service_role;

create or replace function public.get_own_season_registration(
  actor_user_id uuid,
  target_season_id uuid
)
returns table (
  season_id uuid,
  player_id uuid,
  participation_type text,
  registration_status text,
  registered_at timestamptz,
  payment_status text,
  amount_due_cents integer,
  amount_paid_cents integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    sp.season_id,
    sp.player_id,
    sp.participation_type,
    sp.status,
    sp.created_at,
    coalesce(ps.status, 'unpaid'::text),
    coalesce(ps.amount_due_cents, 0),
    coalesce(ps.amount_paid_cents, 0)
  from public.players p
  join public.season_players sp on sp.player_id = p.id
  left join private.payment_status ps
    on ps.season_id = sp.season_id and ps.player_id = sp.player_id
  where p.user_id = actor_user_id
    and sp.season_id = target_season_id
  limit 1;
$$;

revoke all on function public.get_own_season_registration(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_own_season_registration(uuid, uuid) to service_role;

comment on function public.register_for_season(uuid, uuid, text) is
  'Service-role-only self-registration boundary. Creates one durable player/season registration and initializes private payment status without exposing payment data publicly.';
comment on function public.get_own_season_registration(uuid, uuid) is
  'Service-role-only read boundary for an authenticated player to see their own season registration and payment status.';
