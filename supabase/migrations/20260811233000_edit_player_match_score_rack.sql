create or replace function public.update_player_match_score_rack(
  actor_user_id uuid,
  target_player_match_id uuid,
  target_scoring_team_id uuid,
  target_rack_number integer,
  rack_winner_side text
)
returns table (
  player_match_id uuid,
  scoring_team_id uuid,
  tracker_player_id uuid,
  rack_number integer,
  discipline text,
  previous_winner_side text,
  winner_side text,
  score_a integer,
  score_b integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  submission private.player_match_score_submissions%rowtype;
  rack_count integer;
  existing_rack jsonb;
  previous_winner text;
  rack_discipline text;
  next_racks jsonb;
  next_score_a integer;
  next_score_b integer;
begin
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  if target_rack_number is null or target_rack_number < 1 then raise exception 'target_rack_number must be a positive integer'; end if;
  if rack_winner_side not in ('A', 'B') then raise exception 'rack_winner_side must be A or B'; end if;

  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;

  tracker_id := private.match_tracker_for_scoring_team(actor_user_id, target_match, target_scoring_team_id);

  select * into submission
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = tracker_id
  for update;

  if not found then raise exception 'Score record is empty'; end if;
  rack_count := jsonb_array_length(coalesce(submission.racks, '[]'::jsonb));
  if target_rack_number > rack_count then raise exception 'Rack is not present in this team score record'; end if;

  existing_rack := submission.racks -> (target_rack_number - 1);
  previous_winner := existing_rack ->> 'winnerSide';
  rack_discipline := existing_rack ->> 'discipline';
  if previous_winner not in ('A', 'B') or rack_discipline not in ('8-ball', '9-ball') then
    raise exception 'Rack record is invalid';
  end if;

  if previous_winner = rack_winner_side then
    select
      count(*) filter (where elem ->> 'winnerSide' = 'A')::integer,
      count(*) filter (where elem ->> 'winnerSide' = 'B')::integer
    into next_score_a, next_score_b
    from jsonb_array_elements(submission.racks) elem;

    return query select target_player_match_id, target_scoring_team_id, tracker_id,
      target_rack_number, rack_discipline, previous_winner, rack_winner_side,
      next_score_a, next_score_b;
    return;
  end if;

  next_racks := jsonb_set(
    submission.racks,
    array[(target_rack_number - 1)::text, 'winnerSide'],
    to_jsonb(rack_winner_side),
    false
  );

  select
    count(*) filter (where elem ->> 'winnerSide' = 'A')::integer,
    count(*) filter (where elem ->> 'winnerSide' = 'B')::integer
  into next_score_a, next_score_b
  from jsonb_array_elements(next_racks) elem;

  update private.player_match_score_submissions
  set racks = next_racks,
      confirmed_at = null,
      updated_at = now()
  where id = submission.id;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values (
    actor_user_id,
    'player_match.team_score_rack_edit',
    'player_match',
    target_player_match_id,
    jsonb_build_object(
      'scoringTeamId', target_scoring_team_id,
      'trackerPlayerId', tracker_id,
      'rackNumber', target_rack_number,
      'discipline', rack_discipline,
      'winnerSide', previous_winner,
      'racks', submission.racks
    ),
    jsonb_build_object(
      'scoringTeamId', target_scoring_team_id,
      'trackerPlayerId', tracker_id,
      'rackNumber', target_rack_number,
      'discipline', rack_discipline,
      'winnerSide', rack_winner_side,
      'racks', next_racks
    )
  );

  return query select target_player_match_id, target_scoring_team_id, tracker_id,
    target_rack_number, rack_discipline, previous_winner, rack_winner_side,
    next_score_a, next_score_b;
end;
$$;

revoke all on function public.update_player_match_score_rack(uuid, uuid, uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.update_player_match_score_rack(uuid, uuid, uuid, integer, text)
  to service_role;

comment on function public.update_player_match_score_rack(uuid, uuid, uuid, integer, text) is
  'Service-role-only surgical edit of one rack in the authorized team-owned score history. Later racks remain unchanged and confirmation is cleared.';
