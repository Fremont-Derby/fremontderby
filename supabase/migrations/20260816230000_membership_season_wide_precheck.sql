-- P0: season-wide active membership pre-checks before team_memberships inserts.

CREATE OR REPLACE FUNCTION public.invite_player_to_team(actor_user_id uuid, target_team_id uuid, target_player_id uuid)
 RETURNS TABLE(id uuid, season_id uuid, team_id uuid, invited_player_id uuid, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = target_player_id
      and tm.team_id is distinct from target_team_id
      and tm.ends_at is null
  ) then
    raise exception 'Player already has an active team membership';
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
$function$
;

CREATE OR REPLACE FUNCTION public.request_team_membership(actor_user_id uuid, target_team_id uuid)
 RETURNS TABLE(id uuid, season_id uuid, team_id uuid, player_id uuid, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.team_id is distinct from target_team_id
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
$function$
;

CREATE OR REPLACE FUNCTION public.respond_to_team_invitation(actor_user_id uuid, target_invitation_id uuid, response_status text)
 RETURNS TABLE(id uuid, season_id uuid, team_id uuid, invited_player_id uuid, status text, responded_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = invitation.season_id
        and tm.player_id = invitation.invited_player_id
        and tm.team_id is distinct from invitation.team_id
        and tm.ends_at is null
    ) then
      raise exception 'Player already has an active team membership';
    end if;
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
$function$
;

CREATE OR REPLACE FUNCTION public.respond_to_team_membership_request(actor_user_id uuid, target_request_id uuid, response_status text)
 RETURNS TABLE(id uuid, season_id uuid, team_id uuid, player_id uuid, status text, resolved_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = request_row.season_id
        and tm.player_id = request_row.player_id
        and tm.team_id is distinct from request_row.team_id
        and tm.ends_at is null
    ) then
      raise exception 'Player already has an active team membership';
    end if;
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
$function$
;
