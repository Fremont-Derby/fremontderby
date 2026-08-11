-- Keep season participation aligned with effective team memberships.
-- A player removed from one of several active teams remains rostered; leaving the
-- final active team returns them to the free-agent pool without rewriting history.

create or replace function public.remove_team_member(
  actor_user_id uuid,
  target_membership_id uuid
)
returns table(
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
as $function$
declare
  membership public.team_memberships%rowtype;
  actor_player_id uuid;
  ended_at timestamptz;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_membership_id is null then raise exception 'target_membership_id is required'; end if;

  select * into membership
  from public.team_memberships tm
  where tm.id = target_membership_id
  for update;
  if not found then raise exception 'Team membership not found'; end if;
  if membership.ends_at is not null then raise exception 'Team membership is already inactive'; end if;
  if membership.role <> 'player' then raise exception 'Captain memberships cannot be removed through this path'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before removing team members'; end if;

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

  ended_at := now();
  update public.team_memberships
  set ends_at = ended_at
  where team_memberships.id = target_membership_id;

  if not exists (
    select 1
    from public.team_memberships active_tm
    where active_tm.season_id = membership.season_id
      and active_tm.player_id = membership.player_id
      and active_tm.ends_at is null
  ) then
    update public.season_players sp
    set participation_type = 'free_agent',
        status = 'active'
    where sp.season_id = membership.season_id
      and sp.player_id = membership.player_id;
  end if;

  insert into private.audit_events(
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_state,
    after_state
  ) values (
    actor_user_id,
    'team.remove_member',
    'team_membership',
    membership.id,
    to_jsonb(membership),
    jsonb_build_object(
      'id', membership.id,
      'season_id', membership.season_id,
      'team_id', membership.team_id,
      'player_id', membership.player_id,
      'role', membership.role,
      'ends_at', ended_at
    )
  );

  return query
  select tm.id, tm.season_id, tm.team_id, tm.player_id, tm.role, tm.ends_at
  from public.team_memberships tm
  where tm.id = target_membership_id;
end;
$function$;

-- Repair active participants stranded by the old transition. This changes only
-- current participation metadata; effective-dated membership and match history stay intact.
update public.season_players sp
set participation_type = 'free_agent'
where sp.status = 'active'
  and sp.participation_type = 'rostered'
  and not exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = sp.season_id
      and tm.player_id = sp.player_id
      and tm.ends_at is null
  );
