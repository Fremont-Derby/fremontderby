create or replace function public.get_player_match_live_context(
  actor_user_id uuid,
  target_player_match_id uuid
)
returns table (
  player_match_id uuid,
  round_number integer,
  match_number integer,
  match_count integer,
  team_a_name text,
  team_b_name text,
  team_score_a integer,
  team_score_b integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;

  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id;
  if not found then raise exception 'Player match not found'; end if;

  if not private.can_score_player_match(actor_user_id, target_match) then
    raise exception 'Only match players or active team captains can view the scorecard';
  end if;

  return query
  select
    target_match.id,
    r.round_number,
    target_match.slot_number,
    (
      select count(*)::integer
      from public.player_matches sibling
      where sibling.team_match_id = target_match.team_match_id
    ),
    team_a.name,
    team_b.name,
    (
      select count(*)::integer
      from public.player_matches sibling
      where sibling.team_match_id = target_match.team_match_id
        and sibling.status in ('finalized', 'corrected')
        and sibling.winner_side = 'A'
    ),
    (
      select count(*)::integer
      from public.player_matches sibling
      where sibling.team_match_id = target_match.team_match_id
        and sibling.status in ('finalized', 'corrected')
        and sibling.winner_side = 'B'
    )
  from public.rounds r
  join public.teams team_a on team_a.id = target_match.team_a_id
  join public.teams team_b on team_b.id = target_match.team_b_id
  where r.id = target_match.round_id;
end;
$$;

revoke all on function public.get_player_match_live_context(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_player_match_live_context(uuid, uuid)
  to service_role;

comment on function public.get_player_match_live_context(uuid, uuid) is
  'Service-role-only authorized live scorecard context: round/match position, team names, and finalized running team score.';
