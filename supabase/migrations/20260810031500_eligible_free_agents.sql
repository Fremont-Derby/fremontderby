create or replace function public.list_eligible_free_agents(
  actor_user_id uuid,
  target_team_id uuid,
  target_round_id uuid
)
returns table (
  season_id uuid,
  round_id uuid,
  player_id uuid,
  display_name text,
  fargo_rating integer,
  rating_status text,
  availability_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  active_roster_count integer;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_team_id is null then
    raise exception 'target_team_id is required';
  end if;

  if target_round_id is null then
    raise exception 'target_round_id is required';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before listing eligible free agents';
  end if;

  select t.season_id
    into target_season_id
  from public.teams t
  where t.id = target_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  if not exists (
    select 1
    from public.rounds r
    where r.id = target_round_id
      and r.season_id = target_season_id
  ) then
    raise exception 'Round not found for team season';
  end if;

  if not exists (
    select 1
    from public.team_matches tm
    where tm.round_id = target_round_id
      and (tm.team_a_id = target_team_id or tm.team_b_id = target_team_id)
  ) then
    raise exception 'Team is not scheduled for target round';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can view eligible free agents';
  end if;

  select private.active_team_roster_count(target_team_id)
    into active_roster_count;

  if active_roster_count >= 4 then
    return;
  end if;

  return query
  select
    sp.season_id,
    fa.round_id,
    p.id as player_id,
    p.display_name,
    pr.fargo_rating,
    pr.rating_status,
    fa.status as availability_status
  from private.free_agent_availability fa
  join public.season_players sp
    on sp.season_id = fa.season_id
   and sp.player_id = fa.player_id
  join public.players p
    on p.id = sp.player_id
  left join public.player_ratings pr
    on pr.player_id = sp.player_id
  where fa.round_id = target_round_id
    and fa.season_id = target_season_id
    and fa.status = 'available'
    and sp.participation_type = 'free_agent'
    and sp.status = 'active'
    and not exists (
      select 1
      from public.team_memberships active_tm
      where active_tm.season_id = target_season_id
        and active_tm.player_id = sp.player_id
        and active_tm.ends_at is null
    )
  order by lower(p.display_name), p.id;
end;
$$;

revoke all on function public.list_eligible_free_agents(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.list_eligible_free_agents(uuid, uuid, uuid)
  to service_role;

comment on function public.list_eligible_free_agents(uuid, uuid, uuid) is
  'Service-role-only captain read model for available free agents eligible to fill a short-handed team round.';
