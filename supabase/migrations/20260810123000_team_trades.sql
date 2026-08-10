create table private.team_trades (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  requesting_team_id uuid not null,
  requested_team_id uuid not null,
  offered_player_id uuid not null references public.players(id) on delete cascade,
  requested_player_id uuid not null references public.players(id) on delete cascade,
  proposed_by_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'declined', 'canceled')),
  admin_exception boolean not null default false,
  requesting_player_accepted_at timestamptz,
  requested_player_accepted_at timestamptz,
  requesting_captain_approved_at timestamptz,
  requested_captain_approved_at timestamptz,
  declined_by_user_id uuid references auth.users(id) on delete set null,
  declined_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (requesting_team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  foreign key (requested_team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  check (requesting_team_id <> requested_team_id),
  check (offered_player_id <> requested_player_id)
);

create index team_trades_player_pending_idx
  on private.team_trades (season_id, status, offered_player_id, requested_player_id);

create index team_trades_team_idx
  on private.team_trades (requesting_team_id, requested_team_id, created_at);

revoke all on table private.team_trades from public, anon, authenticated;
grant all on table private.team_trades to service_role;

create or replace function private.season_roster_lock_has_passed(
  target_season_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select exists (
      select 1
      from public.rounds r
      where r.season_id = s.id
        and r.stage = 'regular'
        and r.round_number >= s.roster_lock_round
        and r.scheduled_on <= current_date
    )
    from public.seasons s
    where s.id = target_season_id
      and s.roster_lock_round is not null
  ), false);
$$;

create or replace function private.actor_captains_team(
  actor_user_id uuid,
  target_team_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.players p
    join public.team_memberships tm
      on tm.player_id = p.id
    where p.user_id = actor_user_id
      and tm.team_id = target_team_id
      and tm.role = 'captain'
      and tm.ends_at is null
  );
$$;

revoke all on function private.season_roster_lock_has_passed(uuid) from public;
revoke all on function private.actor_captains_team(uuid, uuid) from public;

create or replace function private.complete_team_trade_if_ready(
  target_trade_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  trade private.team_trades%rowtype;
  offered_membership public.team_memberships%rowtype;
  requested_membership public.team_memberships%rowtype;
  completed_trade private.team_trades%rowtype;
begin
  select *
    into trade
  from private.team_trades tt
  where tt.id = target_trade_id
  for update;

  if not found or trade.status <> 'pending' then
    return;
  end if;

  if not trade.admin_exception
      and private.season_roster_lock_has_passed(trade.season_id) then
    raise exception 'Roster lock has passed; admin exception required';
  end if;

  if trade.requesting_player_accepted_at is null
      or trade.requested_player_accepted_at is null
      or trade.requesting_captain_approved_at is null
      or trade.requested_captain_approved_at is null then
    return;
  end if;

  select *
    into offered_membership
  from public.team_memberships tm
  where tm.season_id = trade.season_id
    and tm.team_id = trade.requesting_team_id
    and tm.player_id = trade.offered_player_id
    and tm.role = 'player'
    and tm.ends_at is null
  for update;

  if not found then
    raise exception 'Offered player active membership changed';
  end if;

  select *
    into requested_membership
  from public.team_memberships tm
  where tm.season_id = trade.season_id
    and tm.team_id = trade.requested_team_id
    and tm.player_id = trade.requested_player_id
    and tm.role = 'player'
    and tm.ends_at is null
  for update;

  if not found then
    raise exception 'Requested player active membership changed';
  end if;

  update public.team_memberships
  set ends_at = now()
  where id in (offered_membership.id, requested_membership.id);

  insert into public.team_memberships (
    season_id,
    team_id,
    player_id,
    role
  ) values
    (
      trade.season_id,
      trade.requested_team_id,
      trade.offered_player_id,
      'player'
    ),
    (
      trade.season_id,
      trade.requesting_team_id,
      trade.requested_player_id,
      'player'
    );

  update private.team_trades
  set status = 'completed',
      completed_at = now()
  where id = target_trade_id
  returning * into completed_trade;

  insert into private.audit_events (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  ) values (
    trade.proposed_by_user_id,
    'team_trade.complete',
    'team_trade',
    target_trade_id,
    jsonb_build_object(
      'offeredMembership', to_jsonb(offered_membership),
      'requestedMembership', to_jsonb(requested_membership)
    ),
    to_jsonb(completed_trade)
  );
end;
$$;

revoke all on function private.complete_team_trade_if_ready(uuid) from public;

create or replace function public.propose_team_trade(
  actor_user_id uuid,
  actor_team_id uuid,
  offered_roster_player_id uuid,
  requested_roster_team_id uuid,
  requested_roster_player_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  requesting_team_id uuid,
  requested_team_id uuid,
  offered_player_id uuid,
  requested_player_id uuid,
  status text,
  admin_exception boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_season_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if actor_team_id is null or requested_roster_team_id is null then
    raise exception 'Both trade teams are required';
  end if;

  if offered_roster_player_id is null or requested_roster_player_id is null then
    raise exception 'Both trade players are required';
  end if;

  select t.season_id
    into target_season_id
  from public.teams t
  where t.id = actor_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  if not exists (
    select 1
    from public.teams t
    where t.id = requested_roster_team_id
      and t.season_id = target_season_id
  ) then
    raise exception 'Trade teams must be in the same season';
  end if;

  if private.season_roster_lock_has_passed(target_season_id) then
    raise exception 'Roster lock has passed; admin exception required';
  end if;

  if not private.actor_captains_team(actor_user_id, actor_team_id) then
    raise exception 'Only the active captain can propose a trade';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = actor_team_id
      and tm.player_id = offered_roster_player_id
      and tm.role = 'player'
      and tm.ends_at is null
  ) then
    raise exception 'Offered player must be an active non-captain roster member';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = requested_roster_team_id
      and tm.player_id = requested_roster_player_id
      and tm.role = 'player'
      and tm.ends_at is null
  ) then
    raise exception 'Requested player must be an active non-captain roster member';
  end if;

  if exists (
    select 1
    from private.team_trades tt
    where tt.season_id = target_season_id
      and tt.status = 'pending'
      and (
        offered_roster_player_id in (tt.offered_player_id, tt.requested_player_id)
        or requested_roster_player_id in (tt.offered_player_id, tt.requested_player_id)
      )
  ) then
    raise exception 'A pending trade already includes one of these players';
  end if;

  return query
  insert into private.team_trades (
    season_id,
    requesting_team_id,
    requested_team_id,
    offered_player_id,
    requested_player_id,
    proposed_by_user_id,
    requesting_captain_approved_at
  ) values (
    target_season_id,
    actor_team_id,
    requested_roster_team_id,
    offered_roster_player_id,
    requested_roster_player_id,
    actor_user_id,
    now()
  )
  returning
    team_trades.id,
    team_trades.season_id,
    team_trades.requesting_team_id,
    team_trades.requested_team_id,
    team_trades.offered_player_id,
    team_trades.requested_player_id,
    team_trades.status,
    team_trades.admin_exception,
    team_trades.created_at;
end;
$$;

create or replace function public.admin_propose_team_trade_exception(
  actor_user_id uuid,
  actor_team_id uuid,
  offered_roster_player_id uuid,
  requested_roster_team_id uuid,
  requested_roster_player_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  requesting_team_id uuid,
  requested_team_id uuid,
  offered_player_id uuid,
  requested_player_id uuid,
  status text,
  admin_exception boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_season_id uuid;
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

  if actor_team_id is null or requested_roster_team_id is null then
    raise exception 'Both trade teams are required';
  end if;

  if offered_roster_player_id is null or requested_roster_player_id is null then
    raise exception 'Both trade players are required';
  end if;

  select t.season_id
    into target_season_id
  from public.teams t
  where t.id = actor_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  if not exists (
    select 1
    from public.teams t
    where t.id = requested_roster_team_id
      and t.season_id = target_season_id
  ) then
    raise exception 'Trade teams must be in the same season';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = actor_team_id
      and tm.player_id = offered_roster_player_id
      and tm.role = 'player'
      and tm.ends_at is null
  ) then
    raise exception 'Offered player must be an active non-captain roster member';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = requested_roster_team_id
      and tm.player_id = requested_roster_player_id
      and tm.role = 'player'
      and tm.ends_at is null
  ) then
    raise exception 'Requested player must be an active non-captain roster member';
  end if;

  if exists (
    select 1
    from private.team_trades tt
    where tt.season_id = target_season_id
      and tt.status = 'pending'
      and (
        offered_roster_player_id in (tt.offered_player_id, tt.requested_player_id)
        or requested_roster_player_id in (tt.offered_player_id, tt.requested_player_id)
      )
  ) then
    raise exception 'A pending trade already includes one of these players';
  end if;

  return query
  insert into private.team_trades (
    season_id,
    requesting_team_id,
    requested_team_id,
    offered_player_id,
    requested_player_id,
    proposed_by_user_id,
    admin_exception
  ) values (
    target_season_id,
    actor_team_id,
    requested_roster_team_id,
    offered_roster_player_id,
    requested_roster_player_id,
    actor_user_id,
    true
  )
  returning
    team_trades.id,
    team_trades.season_id,
    team_trades.requesting_team_id,
    team_trades.requested_team_id,
    team_trades.offered_player_id,
    team_trades.requested_player_id,
    team_trades.status,
    team_trades.admin_exception,
    team_trades.created_at;
end;
$$;

create or replace function public.respond_to_team_trade_player(
  actor_user_id uuid,
  target_trade_id uuid,
  response_status text
)
returns table (
  id uuid,
  season_id uuid,
  status text,
  requesting_player_accepted_at timestamptz,
  requested_player_accepted_at timestamptz,
  declined_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  trade private.team_trades%rowtype;
  actor_player_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_trade_id is null then
    raise exception 'target_trade_id is required';
  end if;

  if response_status not in ('accepted', 'declined') then
    raise exception 'response_status must be accepted or declined';
  end if;

  select *
    into trade
  from private.team_trades tt
  where tt.id = target_trade_id
  for update;

  if not found then
    raise exception 'Trade not found';
  end if;

  if trade.status <> 'pending' then
    raise exception 'Trade is no longer pending';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if actor_player_id is null
      or actor_player_id not in (trade.offered_player_id, trade.requested_player_id) then
    raise exception 'Only a traded player can respond';
  end if;

  if response_status = 'declined' then
    update private.team_trades
    set status = 'declined',
        declined_by_user_id = actor_user_id,
        declined_at = now()
    where team_trades.id = target_trade_id;
  elsif actor_player_id = trade.offered_player_id then
    update private.team_trades
    set requesting_player_accepted_at = coalesce(requesting_player_accepted_at, now())
    where team_trades.id = target_trade_id;
  else
    update private.team_trades
    set requested_player_accepted_at = coalesce(requested_player_accepted_at, now())
    where team_trades.id = target_trade_id;
  end if;

  if response_status = 'accepted' then
    perform private.complete_team_trade_if_ready(target_trade_id);
  end if;

  return query
  select
    tt.id,
    tt.season_id,
    tt.status,
    tt.requesting_player_accepted_at,
    tt.requested_player_accepted_at,
    tt.declined_at,
    tt.completed_at
  from private.team_trades tt
  where tt.id = target_trade_id;
end;
$$;

create or replace function public.approve_team_trade_captain(
  actor_user_id uuid,
  target_trade_id uuid,
  response_status text
)
returns table (
  id uuid,
  season_id uuid,
  status text,
  requesting_captain_approved_at timestamptz,
  requested_captain_approved_at timestamptz,
  declined_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  trade private.team_trades%rowtype;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_trade_id is null then
    raise exception 'target_trade_id is required';
  end if;

  if response_status not in ('approved', 'declined') then
    raise exception 'response_status must be approved or declined';
  end if;

  select *
    into trade
  from private.team_trades tt
  where tt.id = target_trade_id
  for update;

  if not found then
    raise exception 'Trade not found';
  end if;

  if trade.status <> 'pending' then
    raise exception 'Trade is no longer pending';
  end if;

  if not private.actor_captains_team(actor_user_id, trade.requesting_team_id)
      and not private.actor_captains_team(actor_user_id, trade.requested_team_id) then
    raise exception 'Only an active captain for a trade team can approve';
  end if;

  if response_status = 'declined' then
    update private.team_trades
    set status = 'declined',
        declined_by_user_id = actor_user_id,
        declined_at = now()
    where team_trades.id = target_trade_id;
  elsif private.actor_captains_team(actor_user_id, trade.requesting_team_id) then
    update private.team_trades
    set requesting_captain_approved_at = coalesce(requesting_captain_approved_at, now())
    where team_trades.id = target_trade_id;
  else
    update private.team_trades
    set requested_captain_approved_at = coalesce(requested_captain_approved_at, now())
    where team_trades.id = target_trade_id;
  end if;

  if response_status = 'approved' then
    perform private.complete_team_trade_if_ready(target_trade_id);
  end if;

  return query
  select
    tt.id,
    tt.season_id,
    tt.status,
    tt.requesting_captain_approved_at,
    tt.requested_captain_approved_at,
    tt.declined_at,
    tt.completed_at
  from private.team_trades tt
  where tt.id = target_trade_id;
end;
$$;

create or replace function public.get_own_team_trades(
  actor_user_id uuid
)
returns table (
  player_id uuid,
  trades jsonb
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
  visible_trades as (
    select tt.*
    from private.team_trades tt
    cross join actor_player ap
    where tt.offered_player_id = ap.id
       or tt.requested_player_id = ap.id
       or exists (
        select 1
        from public.team_memberships tm
        where tm.player_id = ap.id
          and tm.role = 'captain'
          and tm.ends_at is null
          and tm.team_id in (tt.requesting_team_id, tt.requested_team_id)
       )
  )
  select
    ap.id as player_id,
    coalesce(jsonb_agg(
      jsonb_build_object(
        'tradeId', vt.id,
        'seasonId', vt.season_id,
        'seasonName', s.name,
        'status', vt.status,
        'adminException', vt.admin_exception,
        'requestingTeamId', requesting_team.id,
        'requestingTeamName', requesting_team.name,
        'requestedTeamId', requested_team.id,
        'requestedTeamName', requested_team.name,
        'offeredPlayerId', offered_player.id,
        'offeredPlayerName', offered_player.display_name,
        'requestedPlayerId', requested_player.id,
        'requestedPlayerName', requested_player.display_name,
        'requestingPlayerAcceptedAt', vt.requesting_player_accepted_at,
        'requestedPlayerAcceptedAt', vt.requested_player_accepted_at,
        'requestingCaptainApprovedAt', vt.requesting_captain_approved_at,
        'requestedCaptainApprovedAt', vt.requested_captain_approved_at,
        'declinedAt', vt.declined_at,
        'completedAt', vt.completed_at,
        'createdAt', vt.created_at
      )
      order by vt.created_at desc
    ) filter (where vt.id is not null), '[]'::jsonb) as trades
  from actor_player ap
  left join visible_trades vt on true
  left join public.seasons s on s.id = vt.season_id
  left join public.teams requesting_team on requesting_team.id = vt.requesting_team_id
  left join public.teams requested_team on requested_team.id = vt.requested_team_id
  left join public.players offered_player on offered_player.id = vt.offered_player_id
  left join public.players requested_player on requested_player.id = vt.requested_player_id
  group by ap.id;
$$;

revoke all on function public.propose_team_trade(uuid, uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.propose_team_trade(uuid, uuid, uuid, uuid, uuid)
  to service_role;

revoke all on function public.admin_propose_team_trade_exception(uuid, uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_propose_team_trade_exception(uuid, uuid, uuid, uuid, uuid)
  to service_role;

revoke all on function public.respond_to_team_trade_player(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.respond_to_team_trade_player(uuid, uuid, text)
  to service_role;

revoke all on function public.approve_team_trade_captain(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.approve_team_trade_captain(uuid, uuid, text)
  to service_role;

revoke all on function public.get_own_team_trades(uuid)
  from public, anon, authenticated;
grant execute on function public.get_own_team_trades(uuid)
  to service_role;

comment on table private.team_trades is
  'Private team trade workflow. Completion ends old memberships and starts swapped memberships without rewriting match history.';

comment on function public.propose_team_trade(uuid, uuid, uuid, uuid, uuid) is
  'Service-role-only captain boundary for proposing a pre-lock player-for-player trade.';

comment on function public.admin_propose_team_trade_exception(uuid, uuid, uuid, uuid, uuid) is
  'Service-role-only league-admin exception boundary for proposing a player-for-player trade after roster lock.';

comment on function public.respond_to_team_trade_player(uuid, uuid, text) is
  'Service-role-only moved-player acceptance boundary for pending team trades.';

comment on function public.approve_team_trade_captain(uuid, uuid, text) is
  'Service-role-only captain approval boundary for pending team trades.';

comment on function public.get_own_team_trades(uuid) is
  'Service-role-only actor-scoped read model for trades visible to moved players and involved captains.';
