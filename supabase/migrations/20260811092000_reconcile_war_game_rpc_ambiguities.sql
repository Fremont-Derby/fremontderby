-- Reconcile PL/pgSQL name collisions found by the live Season 1 War Game.
-- Preserve the current multi-team/team-slot/postseason behavior while making
-- conflict targets and update predicates unambiguous on a fresh migration chain.

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
as $function$
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
  on conflict on constraint season_players_season_id_player_id_key do update
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
  on conflict on constraint payment_status_pkey do nothing;

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
$function$;

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
as $function$
declare
  actor_player_id uuid;
  target_season_id uuid;
  request_id uuid;
  pending_invitation_id uuid;
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

  perform private.expire_season_team_registration(target_season_id);
  if not exists (
    select 1
    from private.season_team_slots sts
    where sts.season_id = target_season_id
      and sts.team_id = target_team_id
      and sts.status in ('approved_pending_roster', 'ready', 'confirmed')
  ) then
    raise exception 'This team is not accepting season roster requests';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.ends_at is null
  ) then
    raise exception 'Player is already an active member of this team';
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

  select ti.id into pending_invitation_id
  from private.team_invitations ti
  where ti.season_id = target_season_id
    and ti.team_id = target_team_id
    and ti.invited_player_id = actor_player_id
    and ti.status = 'pending'
  order by ti.created_at
  limit 1
  for update;

  if pending_invitation_id is not null then
    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(target_season_id, target_team_id, actor_player_id, 'player');

    insert into private.team_membership_requests(
      season_id, team_id, player_id, status, resolved_at, resolved_by_user_id
    ) values (
      target_season_id, target_team_id, actor_player_id, 'approved', now(), actor_user_id
    ) returning private.team_membership_requests.id into request_id;

    update private.team_invitations
    set status = 'accepted', responded_at = now()
    where private.team_invitations.id = pending_invitation_id;
  else
    insert into private.team_membership_requests(season_id, team_id, player_id)
    values(target_season_id, target_team_id, actor_player_id)
    returning private.team_membership_requests.id into request_id;
  end if;

  return query
  select r.id, r.season_id, r.team_id, r.player_id, r.status, r.created_at
  from private.team_membership_requests r
  where r.id = request_id;
end;
$function$;

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
as $function$
declare
  request_row private.team_membership_requests%rowtype;
  actor_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_request_id is null then raise exception 'target_request_id is required'; end if;
  if response_status not in ('approved', 'declined') then
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
    if not exists (
      select 1 from public.team_memberships tm
      where tm.season_id = request_row.season_id
        and tm.team_id = request_row.team_id
        and tm.player_id = request_row.player_id
        and tm.ends_at is null
    ) then
      insert into public.team_memberships(season_id, team_id, player_id, role)
      values(request_row.season_id, request_row.team_id, request_row.player_id, 'player');
    end if;

    update private.team_invitations
    set status = 'accepted', responded_at = now()
    where private.team_invitations.season_id = request_row.season_id
      and private.team_invitations.team_id = request_row.team_id
      and private.team_invitations.invited_player_id = request_row.player_id
      and private.team_invitations.status = 'pending';
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
$function$;

create or replace function public.invite_player_to_team(
  actor_user_id uuid,
  target_team_id uuid,
  target_player_id uuid
)
returns table(
  id uuid,
  season_id uuid,
  team_id uuid,
  invited_player_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_player_id uuid;
  target_season_id uuid;
  inserted_invitation_id uuid;
  pending_request_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;

  select t.season_id into target_season_id
  from public.teams t
  where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before inviting players'; end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can invite players';
  end if;

  if not exists (select 1 from public.players p where p.id = target_player_id) then
    raise exception 'Invited player not found';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = target_team_id
      and tm.player_id = target_player_id
      and tm.ends_at is null
  ) then
    raise exception 'Player is already an active member of this team';
  end if;

  select r.id into pending_request_id
  from private.team_membership_requests r
  where r.season_id = target_season_id
    and r.team_id = target_team_id
    and r.player_id = target_player_id
    and r.status = 'pending'
  order by r.created_at
  limit 1
  for update;

  insert into private.team_invitations(
    season_id, team_id, invited_player_id, invited_by_user_id,
    status, responded_at
  ) values (
    target_season_id, target_team_id, target_player_id, actor_user_id,
    case when pending_request_id is null then 'pending' else 'accepted' end,
    case when pending_request_id is null then null else now() end
  ) returning private.team_invitations.id into inserted_invitation_id;

  if pending_request_id is not null then
    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(target_season_id, target_team_id, target_player_id, 'player');

    update private.team_membership_requests
    set status = 'approved', resolved_at = now(), resolved_by_user_id = actor_user_id
    where private.team_membership_requests.season_id = target_season_id
      and private.team_membership_requests.team_id = target_team_id
      and private.team_membership_requests.player_id = target_player_id
      and private.team_membership_requests.status = 'pending';
  end if;

  return query
  select ti.id, ti.season_id, ti.team_id, ti.invited_player_id, ti.status, ti.created_at
  from private.team_invitations ti
  where ti.id = inserted_invitation_id;
end;
$function$;

create or replace function public.respond_to_team_invitation(
  actor_user_id uuid,
  target_invitation_id uuid,
  response_status text
)
returns table(
  id uuid,
  season_id uuid,
  team_id uuid,
  invited_player_id uuid,
  status text,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  invitation private.team_invitations%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_invitation_id is null then raise exception 'target_invitation_id is required'; end if;
  if response_status not in ('accepted', 'declined') then
    raise exception 'response_status must be accepted or declined';
  end if;

  select * into invitation
  from private.team_invitations ti
  where ti.id = target_invitation_id
  for update;
  if not found then raise exception 'Invitation not found'; end if;
  if invitation.status <> 'pending' then raise exception 'Invitation is no longer pending'; end if;

  if not exists (
    select 1 from public.players p
    where p.id = invitation.invited_player_id
      and p.user_id = actor_user_id
  ) then
    raise exception 'Only the invited player can respond';
  end if;

  if response_status = 'accepted' then
    if not exists (
      select 1 from public.team_memberships tm
      where tm.season_id = invitation.season_id
        and tm.team_id = invitation.team_id
        and tm.player_id = invitation.invited_player_id
        and tm.ends_at is null
    ) then
      insert into public.team_memberships(season_id, team_id, player_id, role)
      values(invitation.season_id, invitation.team_id, invitation.invited_player_id, 'player');
    end if;

    update private.team_membership_requests
    set status = 'approved', resolved_at = now(), resolved_by_user_id = actor_user_id
    where private.team_membership_requests.season_id = invitation.season_id
      and private.team_membership_requests.team_id = invitation.team_id
      and private.team_membership_requests.player_id = invitation.invited_player_id
      and private.team_membership_requests.status = 'pending';
  end if;

  update private.team_invitations
  set status = response_status,
      responded_at = now()
  where private.team_invitations.id = target_invitation_id;

  return query
  select ti.id, ti.season_id, ti.team_id, ti.invited_player_id, ti.status, ti.responded_at
  from private.team_invitations ti
  where ti.id = target_invitation_id;
end;
$function$;

create or replace function public.submit_postseason_lineup(
  actor_user_id uuid,
  target_team_match_id uuid,
  target_team_id uuid,
  lineup_player_ids uuid[],
  anchor_player_id uuid
)
returns table(
  lineup_id uuid,
  team_match_id uuid,
  team_id uuid,
  slot_number integer,
  player_id uuid,
  locked_anchor_player_id uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor_player_id uuid;
  target_match public.team_matches%rowtype;
  target_round public.rounds%rowtype;
  saved_lineup_id uuid;
  qualifying_four_count integer;
  qualifying_three_count integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_match_id is null then raise exception 'target_team_match_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if coalesce(array_length(lineup_player_ids, 1), 0) <> 4 then
    raise exception 'Postseason lineup requires exactly four players';
  end if;
  if anchor_player_id is null then raise exception 'Postseason anchor is required'; end if;

  select * into target_match
  from public.team_matches tm
  where tm.id = target_team_match_id
  for update;
  if not found then raise exception 'Team matchup not found'; end if;

  select * into target_round
  from public.rounds r
  where r.id = target_match.round_id;
  if target_round.stage not in ('semifinal', 'championship') then
    raise exception 'Postseason lineup is only valid for a semifinal or championship';
  end if;
  if target_team_id not in (target_match.team_a_id, target_match.team_b_id) then
    raise exception 'Team is not part of this postseason matchup';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if actor_player_id is null then raise exception 'Player profile is required'; end if;
  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can submit a postseason lineup';
  end if;

  if exists (
    select 1 from private.team_lineups tl
    where tl.team_match_id = target_team_match_id
      and tl.team_id = target_team_id
  ) then
    raise exception 'Postseason lineup and anchor are locked after submission';
  end if;

  if (select count(distinct p) from unnest(lineup_player_ids) p) <> 4 then
    raise exception 'Postseason lineup players must be unique';
  end if;
  if not (anchor_player_id = any(lineup_player_ids)) then
    raise exception 'Postseason anchor must be selected from the submitted lineup';
  end if;

  if exists (
    select 1
    from unnest(lineup_player_ids) pid
    where not exists (
      select 1 from public.team_memberships tm
      where tm.season_id = target_match.season_id
        and tm.team_id = target_team_id
        and tm.player_id = pid
        and tm.ends_at is null
    )
  ) then
    raise exception 'Every postseason player must be an active member of the team';
  end if;

  with player_counts as (
    select pid.player_id,
      (
        select count(*)::integer
        from public.player_matches pm
        join public.rounds r on r.id = pm.round_id
        where pm.season_id = target_match.season_id
          and r.stage = 'regular'
          and pm.status in ('finalized', 'corrected')
          and (
            (pm.team_a_id = target_team_id and pm.player_a_id = pid.player_id)
            or (pm.team_b_id = target_team_id and pm.player_b_id = pid.player_id)
          )
      ) as team_matches_played
    from unnest(lineup_player_ids) as pid(player_id)
  )
  select count(*) filter (where team_matches_played >= 4)::integer,
         count(*) filter (where team_matches_played >= 3)::integer
  into qualifying_four_count, qualifying_three_count
  from player_counts;

  if qualifying_four_count < 3 or qualifying_three_count < 4 then
    raise exception 'Postseason lineup requires three players with 4+ team matches and a fourth with 3+';
  end if;

  insert into private.team_lineups(
    season_id, round_id, team_match_id, team_id, submitted_by, anchor_player_id
  ) values (
    target_match.season_id, target_match.round_id, target_team_match_id,
    target_team_id, actor_user_id, anchor_player_id
  ) returning private.team_lineups.id into saved_lineup_id;

  insert into private.team_lineup_slots(
    lineup_id, season_id, round_id, team_id, slot_number, player_id, participation_type
  )
  select saved_lineup_id, target_match.season_id, target_match.round_id,
         target_team_id, lineup.ordinality::integer, lineup.player_id, 'roster'
  from unnest(lineup_player_ids) with ordinality as lineup(player_id, ordinality);

  return query
  select tl.id, tl.team_match_id, tl.team_id, tls.slot_number, tls.player_id, tl.anchor_player_id
  from private.team_lineups tl
  join private.team_lineup_slots tls on tls.lineup_id = tl.id
  where tl.id = saved_lineup_id
  order by tls.slot_number;
end;
$function$;

revoke all on function public.register_for_season(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.request_team_membership(uuid, uuid) from public, anon, authenticated;
revoke all on function public.respond_to_team_membership_request(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.invite_player_to_team(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.respond_to_team_invitation(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.submit_postseason_lineup(uuid, uuid, uuid, uuid[], uuid) from public, anon, authenticated;

grant execute on function public.register_for_season(uuid, uuid, text) to service_role;
grant execute on function public.request_team_membership(uuid, uuid) to service_role;
grant execute on function public.respond_to_team_membership_request(uuid, uuid, text) to service_role;
grant execute on function public.invite_player_to_team(uuid, uuid, uuid) to service_role;
grant execute on function public.respond_to_team_invitation(uuid, uuid, text) to service_role;
grant execute on function public.submit_postseason_lineup(uuid, uuid, uuid, uuid[], uuid) to service_role;
