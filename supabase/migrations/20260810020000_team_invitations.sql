create table private.team_invitations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null,
  invited_player_id uuid not null references public.players(id) on delete cascade,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'canceled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade
);

create unique index one_pending_team_invitation_per_player
  on private.team_invitations (team_id, invited_player_id)
  where status = 'pending';

create index team_invitations_invited_player_idx
  on private.team_invitations (invited_player_id, status, created_at);

revoke all on table private.team_invitations from public, anon, authenticated;
grant all on table private.team_invitations to service_role;

create or replace function public.invite_player_to_team(
  actor_user_id uuid,
  target_team_id uuid,
  target_player_id uuid
)
returns table (
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
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  active_roster_count integer;
  pending_invitation_count integer;
  inserted_invitation_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_team_id is null then
    raise exception 'target_team_id is required';
  end if;

  if target_player_id is null then
    raise exception 'target_player_id is required';
  end if;

  select t.season_id
    into target_season_id
  from public.teams t
  where t.id = target_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before inviting players';
  end if;

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

  select count(*)::integer
    into active_roster_count
  from public.team_memberships tm
  where tm.team_id = target_team_id
    and tm.ends_at is null;

  select count(*)::integer
    into pending_invitation_count
  from private.team_invitations ti
  where ti.team_id = target_team_id
    and ti.status = 'pending';

  if active_roster_count + pending_invitation_count >= 4 then
    raise exception 'Team roster has no open primary spots';
  end if;

  insert into private.team_invitations (
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
$$;

create or replace function public.respond_to_team_invitation(
  actor_user_id uuid,
  target_invitation_id uuid,
  response_status text
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
  active_roster_count integer;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_invitation_id is null then
    raise exception 'target_invitation_id is required';
  end if;

  if response_status not in ('accepted', 'declined') then
    raise exception 'response_status must be accepted or declined';
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
    raise exception 'Invitation is no longer pending';
  end if;

  if not exists (
    select 1
    from public.players p
    where p.id = invitation.invited_player_id
      and p.user_id = actor_user_id
  ) then
    raise exception 'Only the invited player can respond';
  end if;

  if response_status = 'accepted' then
    select count(*)::integer
      into active_roster_count
    from public.team_memberships tm
    where tm.team_id = invitation.team_id
      and tm.ends_at is null;

    if active_roster_count >= 4 then
      raise exception 'Team roster has no open primary spots';
    end if;

    insert into public.team_memberships (
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
  where id = target_invitation_id;

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

revoke all on function public.invite_player_to_team(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.invite_player_to_team(uuid, uuid, uuid)
  to service_role;

revoke all on function public.respond_to_team_invitation(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.respond_to_team_invitation(uuid, uuid, text)
  to service_role;

comment on table private.team_invitations is
  'Private team roster invitations. Captains create invitations; invited players accept or decline.';

comment on function public.invite_player_to_team(uuid, uuid, uuid) is
  'Service-role-only captain invitation boundary with roster-cap checks.';

comment on function public.respond_to_team_invitation(uuid, uuid, text) is
  'Service-role-only invited-player response boundary. Accepting creates the team membership.';
