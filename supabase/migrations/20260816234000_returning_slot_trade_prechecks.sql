-- P1/P2: returning-slot name+membership pre-checks; trade residual membership guard.

CREATE OR REPLACE FUNCTION public.respond_to_returning_team_slot(actor_user_id uuid, target_slot_id uuid, response_action text, transfer_player_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(slot_id uuid, slot_status text, team_id uuid, assigned_captain_player_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_player_id uuid;
  slot_row private.season_team_slots%rowtype;
  target_captain_player_id uuid;
  target_captain_user_id uuid;
  source_team_name text;
  inserted_team_id uuid;
begin
  if response_action not in ('confirm', 'release', 'transfer') then
    raise exception 'response_action must be confirm, release, or transfer';
  end if;
  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;

  select * into slot_row
  from private.season_team_slots sts where sts.id = target_slot_id
  for update;
  if not found then raise exception 'Returning team slot not found'; end if;

  perform private.expire_season_team_registration(slot_row.season_id);
  select * into slot_row
  from private.season_team_slots sts where sts.id = target_slot_id
  for update;

  if slot_row.status not in ('reserved', 'transferred') then
    raise exception 'Returning team slot is no longer awaiting a response';
  end if;
  if slot_row.assigned_captain_player_id <> actor_player_id then
    raise exception 'Only the assigned returning captain can respond';
  end if;

  if response_action = 'release' then
    update private.season_team_slots
    set status = 'released', resolved_at = now(), updated_at = now()
    where id = target_slot_id;
  elsif response_action = 'transfer' then
    if transfer_player_id is null or transfer_player_id = actor_player_id then
      raise exception 'Choose another eligible player for the transfer';
    end if;
    if not exists (select 1 from public.players p where p.id = transfer_player_id and p.user_id is not null) then
      raise exception 'Transfer player must have a signed-in player profile';
    end if;
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = slot_row.season_id
        and tm.player_id = transfer_player_id
        and tm.role = 'captain'
        and tm.ends_at is null
    ) then
      raise exception 'Transfer player already captains a team in this season';
    end if;
    update private.season_team_slots
    set status = 'transferred',
        assigned_captain_player_id = transfer_player_id,
        updated_at = now()
    where id = target_slot_id;
  else
    target_captain_player_id := slot_row.assigned_captain_player_id;
    select p.user_id into target_captain_user_id
    from public.players p where p.id = target_captain_player_id;
    select t.name into source_team_name
    from public.teams t where t.id = slot_row.source_team_id;
    if target_captain_user_id is null then
      raise exception 'Assigned captain must have a signed-in player profile';
    end if;
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = slot_row.season_id
        and tm.player_id = target_captain_player_id
        and tm.role = 'captain'
        and tm.ends_at is null
    ) then
      raise exception 'Assigned captain already captains a team in this season';
    end if;
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = slot_row.season_id
        and tm.player_id = target_captain_player_id
        and tm.ends_at is null
    ) then
      raise exception 'Player already has an active team membership';
    end if;
    if exists (
      select 1 from public.teams t
      where t.season_id = slot_row.season_id
        and lower(btrim(t.name)) = lower(btrim(source_team_name))
    ) then
      raise exception 'That team name is already used in this season';
    end if;

    insert into public.teams(season_id, name, created_by)
    values(slot_row.season_id, source_team_name, target_captain_user_id)
    returning public.teams.id into inserted_team_id;
    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(slot_row.season_id, inserted_team_id, target_captain_player_id, 'captain');
    update private.season_team_slots
    set status = 'confirmed',
        team_id = inserted_team_id,
        resolved_at = now(),
        updated_at = now()
    where id = target_slot_id;
  end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'returning_team_slot.' || response_action,
    'season_team_slot',
    target_slot_id,
    jsonb_build_object('transferPlayerId', transfer_player_id)
  );

  return query
  select sts.id, sts.status, sts.team_id, sts.assigned_captain_player_id
  from private.season_team_slots sts where sts.id = target_slot_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.complete_team_trade_if_ready(target_trade_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = trade.season_id
      and tm.player_id in (trade.offered_player_id, trade.requested_player_id)
      and tm.ends_at is null
  ) then
    raise exception 'Trade blocked: player still has an active team membership';
  end if;

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
$function$
;
