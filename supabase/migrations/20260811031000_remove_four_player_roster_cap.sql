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
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;

  select t.season_id
    into target_season_id
  from public.teams t
  where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before inviting players'; end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can invite players';
  end if;

  if not exists (
    select 1
    from public.players p
    where p.id = target_player_id
  ) then
    raise exception 'Invited player not found';
  end if;

  if exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = target_player_id
      and tm.ends_at is null
  ) then
    raise exception 'Player already has an active team membership';
  end if;

  insert into private.team_invitations(
    season_id,
    team_id,
    invited_player_id,
    invited_by_user_id
  ) values (
    target_season_id,
    target_team_id,
    target_player_id,
    actor_user_id
  )
  returning team_invitations.id into inserted_invitation_id;

  return query
  select
    ti.id,
    ti.season_id,
    ti.team_id,
    ti.invited_player_id,
    ti.status,
    ti.created_at
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

  select *
    into invitation
  from private.team_invitations ti
  where ti.id = target_invitation_id
  for update;
  if not found then raise exception 'Invitation not found'; end if;
  if invitation.status <> 'pending' then raise exception 'Invitation is no longer pending'; end if;

  if not exists (
    select 1
    from public.players p
    where p.id = invitation.invited_player_id
      and p.user_id = actor_user_id
  ) then
    raise exception 'Only the invited player can respond';
  end if;

  if response_status = 'accepted' then
    insert into public.team_memberships(
      season_id,
      team_id,
      player_id,
      role
    ) values (
      invitation.season_id,
      invitation.team_id,
      invitation.invited_player_id,
      'player'
    );
  end if;

  update private.team_invitations
  set status = response_status,
      responded_at = now()
  where private.team_invitations.id = target_invitation_id;

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
$function$;
