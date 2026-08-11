-- Replace the obsolete one-team-per-season roster rule with target-team uniqueness.
-- Captaincy remains separately limited to one active team per player per season.

drop index if exists public.one_active_team_membership_per_season;

drop index if exists public.one_active_team_membership_per_team;
create unique index one_active_team_membership_per_team
  on public.team_memberships (season_id, team_id, player_id)
  where ends_at is null;

drop index if exists public.one_active_captaincy_per_season;
create unique index one_active_captaincy_per_season
  on public.team_memberships (season_id, player_id)
  where ends_at is null and role = 'captain';

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
    where season_id = request_row.season_id
      and team_id = request_row.team_id
      and invited_player_id = request_row.player_id
      and status = 'pending';
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
set search_path to ''
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
  ) returning team_invitations.id into inserted_invitation_id;

  if pending_request_id is not null then
    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(target_season_id, target_team_id, target_player_id, 'player');

    update private.team_membership_requests
    set status = 'approved', resolved_at = now(), resolved_by_user_id = actor_user_id
    where private.team_membership_requests.id = pending_request_id;
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
set search_path to ''
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
    where season_id = invitation.season_id
      and team_id = invitation.team_id
      and player_id = invitation.invited_player_id
      and status = 'pending';
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

revoke all on function public.request_team_membership(uuid, uuid) from public, anon, authenticated;
revoke all on function public.respond_to_team_membership_request(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.invite_player_to_team(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.respond_to_team_invitation(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.request_team_membership(uuid, uuid) to service_role;
grant execute on function public.respond_to_team_membership_request(uuid, uuid, text) to service_role;
grant execute on function public.invite_player_to_team(uuid, uuid, uuid) to service_role;
grant execute on function public.respond_to_team_invitation(uuid, uuid, text) to service_role;