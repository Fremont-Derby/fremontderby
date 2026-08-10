create or replace function public.cancel_team_invitation(
  actor_user_id uuid,
  target_invitation_id uuid
)
returns table (
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
as $$
declare
  invitation private.team_invitations%rowtype;
  actor_player_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_invitation_id is null then
    raise exception 'target_invitation_id is required';
  end if;

  select *
    into invitation
  from private.team_invitations ti
  where ti.id = target_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if invitation.status <> 'pending' then
    raise exception 'Only pending invitations can be canceled';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before canceling invitations';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = invitation.team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can cancel invitations';
  end if;

  update private.team_invitations
  set status = 'canceled',
      responded_at = now()
  where team_invitations.id = target_invitation_id;

  return query
  select
    ti.id,
    ti.season_id,
    ti.team_id,
    ti.invited_player_id,
    ti.status,
    ti.responded_at
  from private.team_invitations ti
  where ti.id = target_invitation_id;
end;
$$;

create or replace function public.remove_team_member(
  actor_user_id uuid,
  target_membership_id uuid
)
returns table (
  id uuid,
  season_id uuid,
  team_id uuid,
  player_id uuid,
  role text,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership public.team_memberships%rowtype;
  actor_player_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_membership_id is null then
    raise exception 'target_membership_id is required';
  end if;

  select *
    into membership
  from public.team_memberships tm
  where tm.id = target_membership_id
  for update;

  if not found then
    raise exception 'Team membership not found';
  end if;

  if membership.ends_at is not null then
    raise exception 'Team membership is already inactive';
  end if;

  if membership.role <> 'player' then
    raise exception 'Captain memberships cannot be removed through this path';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before removing team members';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = membership.team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can remove team members';
  end if;

  update public.team_memberships
  set ends_at = now()
  where team_memberships.id = target_membership_id;

  return query
  select
    tm.id,
    tm.season_id,
    tm.team_id,
    tm.player_id,
    tm.role,
    tm.ends_at
  from public.team_memberships tm
  where tm.id = target_membership_id;
end;
$$;

revoke all on function public.cancel_team_invitation(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_team_invitation(uuid, uuid)
  to service_role;

revoke all on function public.remove_team_member(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.remove_team_member(uuid, uuid)
  to service_role;

comment on function public.cancel_team_invitation(uuid, uuid) is
  'Service-role-only captain boundary for canceling pending team invitations.';

comment on function public.remove_team_member(uuid, uuid) is
  'Service-role-only captain boundary for ending active non-captain roster memberships.';
