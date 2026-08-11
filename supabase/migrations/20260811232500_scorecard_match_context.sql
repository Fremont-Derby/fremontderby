drop function if exists public.get_player_match_scorecard(uuid, uuid);

create function public.get_player_match_scorecard(
  actor_user_id uuid,
  target_player_match_id uuid
)
returns table (
  player_match_id uuid,
  season_id uuid,
  round_id uuid,
  team_match_id uuid,
  slot_number integer,
  round_number integer,
  round_stage text,
  player_match_count integer,
  team_a_id uuid,
  team_a_name text,
  team_b_id uuid,
  team_b_name text,
  team_score_a integer,
  team_score_b integer,
  player_a_id uuid,
  player_a_display_name text,
  player_a_fargo_rating integer,
  player_a_rating_status text,
  player_b_id uuid,
  player_b_display_name text,
  player_b_fargo_rating integer,
  player_b_rating_status text,
  race_to_a integer,
  race_to_b integer,
  opening_block_length integer,
  opening_discipline text,
  current_discipline text,
  first_break text,
  score_a integer,
  score_b integer,
  winner_side text,
  winner_player_id uuid,
  status text,
  racks jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_player_match_id is null then
    raise exception 'target_player_match_id is required';
  end if;

  select *
    into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id;

  if not found then
    raise exception 'Player match not found';
  end if;

  if not private.can_score_player_match(actor_user_id, target_match) then
    raise exception 'Only match players or active team captains can view the scorecard';
  end if;

  return query
  select
    pm.id,
    pm.season_id,
    pm.round_id,
    pm.team_match_id,
    pm.slot_number,
    r.round_number,
    r.stage,
    match_totals.player_match_count,
    pm.team_a_id,
    team_a.name,
    pm.team_b_id,
    team_b.name,
    match_totals.team_score_a,
    match_totals.team_score_b,
    pm.player_a_id,
    player_a.display_name,
    pm.player_a_fargo_rating,
    pm.player_a_rating_status,
    pm.player_b_id,
    player_b.display_name,
    pm.player_b_fargo_rating,
    pm.player_b_rating_status,
    pm.race_to_a,
    pm.race_to_b,
    pm.opening_block_length,
    pm.opening_discipline,
    pm.current_discipline,
    pm.first_break,
    pm.score_a,
    pm.score_b,
    pm.winner_side,
    pm.winner_player_id,
    pm.status,
    coalesce(rack_rows.racks, '[]'::jsonb)
  from public.player_matches pm
  join public.players player_a on player_a.id = pm.player_a_id
  join public.players player_b on player_b.id = pm.player_b_id
  join public.teams team_a on team_a.id = pm.team_a_id
  join public.teams team_b on team_b.id = pm.team_b_id
  join public.rounds r on r.id = pm.round_id
  left join lateral (
    select
      count(*)::integer as player_match_count,
      count(*) filter (
        where sibling.status in ('finalized', 'corrected')
          and sibling.winner_side = 'A'
      )::integer as team_score_a,
      count(*) filter (
        where sibling.status in ('finalized', 'corrected')
          and sibling.winner_side = 'B'
      )::integer as team_score_b
    from public.player_matches sibling
    where sibling.team_match_id = pm.team_match_id
  ) match_totals on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'rackNumber', ordered_racks.rack_number,
        'discipline', ordered_racks.discipline,
        'winnerSide', ordered_racks.winner_side,
        'winnerPlayerId', ordered_racks.winner_player_id,
        'recordedAt', ordered_racks.recorded_at
      ) order by ordered_racks.rack_number
    ) as racks
    from public.player_match_racks ordered_racks
    where ordered_racks.player_match_id = pm.id
  ) rack_rows on true
  where pm.id = target_player_match_id;
end;
$$;

revoke all on function public.get_player_match_scorecard(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_player_match_scorecard(uuid, uuid)
  to service_role;

comment on function public.get_player_match_scorecard(uuid, uuid) is
  'Service-role scorecard read model with player race, round/slot context, team names, and derived finalized team score.';
