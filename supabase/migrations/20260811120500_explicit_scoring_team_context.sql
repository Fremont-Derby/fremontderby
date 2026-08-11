create or replace function private.match_tracker_for_scoring_team(
  actor_user_id uuid,
  target_match public.player_matches,
  scoring_team_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if scoring_team_id is null then raise exception 'scoring_team_id is required'; end if;
  if scoring_team_id not in (target_match.team_a_id, target_match.team_b_id) then
    raise exception 'Scoring team is not part of this player match';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id
  limit 1;

  if actor_player_id is null or not exists (
    select 1
    from public.team_memberships tm
    where tm.player_id = actor_player_id
      and tm.season_id = target_match.season_id
      and tm.team_id = scoring_team_id
      and tm.ends_at is null
  ) then
    raise exception 'Actor is not an active member of the scoring team';
  end if;

  return case
    when scoring_team_id = target_match.team_a_id then target_match.player_a_id
    else target_match.player_b_id
  end;
end;
$$;

revoke all on function private.match_tracker_for_scoring_team(uuid, public.player_matches, uuid) from public, anon, authenticated;
grant execute on function private.match_tracker_for_scoring_team(uuid, public.player_matches, uuid) to service_role;

drop function if exists public.get_player_match_score_comparison(uuid, uuid);
create function public.get_player_match_score_comparison(
  actor_user_id uuid,
  target_player_match_id uuid,
  scoring_team_id uuid
)
returns table(
  player_match_id uuid,
  scoring_team_id uuid,
  tracker_player_id uuid,
  opponent_player_id uuid,
  own_racks jsonb,
  opponent_racks jsonb,
  own_confirmed_at timestamptz,
  opponent_confirmed_at timestamptz,
  histories_match boolean,
  mismatch_rack_number integer,
  both_confirmed boolean,
  ready_to_finalize boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  opponent_id uuid;
  own_submission private.player_match_score_submissions%rowtype;
  opponent_submission private.player_match_score_submissions%rowtype;
  own_history jsonb;
  opponent_history jsonb;
  mismatch_number integer;
begin
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  select * into target_match from public.player_matches pm where pm.id = target_player_match_id;
  if not found then raise exception 'Player match not found'; end if;

  tracker_id := private.match_tracker_for_scoring_team(actor_user_id, target_match, scoring_team_id);
  opponent_id := case when tracker_id = target_match.player_a_id then target_match.player_b_id else target_match.player_a_id end;

  select * into own_submission from private.player_match_score_submissions s
    where s.player_match_id = target_player_match_id and s.tracker_player_id = tracker_id;
  select * into opponent_submission from private.player_match_score_submissions s
    where s.player_match_id = target_player_match_id and s.tracker_player_id = opponent_id;

  own_history := coalesce(own_submission.racks, '[]'::jsonb);
  opponent_history := coalesce(opponent_submission.racks, '[]'::jsonb);

  select gs + 1 into mismatch_number
  from generate_series(0, greatest(jsonb_array_length(own_history), jsonb_array_length(opponent_history)) - 1) gs
  where (own_history -> gs) is distinct from (opponent_history -> gs)
  order by gs limit 1;

  return query select target_player_match_id, scoring_team_id, tracker_id, opponent_id,
    own_history, opponent_history, own_submission.confirmed_at, opponent_submission.confirmed_at,
    (own_history = opponent_history and jsonb_array_length(own_history) > 0), mismatch_number,
    (own_submission.confirmed_at is not null and opponent_submission.confirmed_at is not null),
    (own_history = opponent_history and jsonb_array_length(own_history) > 0
      and own_submission.confirmed_at is not null and opponent_submission.confirmed_at is not null);
end;
$$;

revoke all on function public.get_player_match_score_comparison(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_player_match_score_comparison(uuid, uuid, uuid) to service_role;

drop function if exists public.record_player_match_score_rack(uuid, uuid, text);
create function public.record_player_match_score_rack(
  actor_user_id uuid,
  target_player_match_id uuid,
  scoring_team_id uuid,
  rack_winner_side text
)
returns table(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, rack_number integer, discipline text, winner_side text, score_a integer, score_b integer, record_complete boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  existing_submission private.player_match_score_submissions%rowtype;
  next_rack_number integer;
  rack_discipline text;
  next_racks jsonb;
  next_score_a integer;
  next_score_b integer;
begin
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  if rack_winner_side not in ('A', 'B') then raise exception 'rack_winner_side must be A or B'; end if;
  select * into target_match from public.player_matches pm where pm.id = target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;
  if target_match.race_to_a is null or target_match.race_to_b is null then raise exception 'Race targets are required before recording racks'; end if;

  tracker_id := private.match_tracker_for_scoring_team(actor_user_id, target_match, scoring_team_id);
  select * into existing_submission from private.player_match_score_submissions s
    where s.player_match_id = target_player_match_id and s.tracker_player_id = tracker_id for update;
  if not found then existing_submission.racks := '[]'::jsonb; end if;

  select count(*) filter (where elem->>'winnerSide' = 'A')::integer,
         count(*) filter (where elem->>'winnerSide' = 'B')::integer
    into next_score_a, next_score_b from jsonb_array_elements(existing_submission.racks) elem;
  if next_score_a >= target_match.race_to_a or next_score_b >= target_match.race_to_b then raise exception 'Score record is already complete'; end if;

  next_rack_number := jsonb_array_length(existing_submission.racks) + 1;
  rack_discipline := case when next_rack_number <= target_match.opening_block_length then target_match.opening_discipline
    when target_match.opening_discipline = '8-ball' then '9-ball' else '8-ball' end;
  next_racks := existing_submission.racks || jsonb_build_array(jsonb_build_object(
    'rackNumber', next_rack_number, 'discipline', rack_discipline, 'winnerSide', rack_winner_side));

  select count(*) filter (where elem->>'winnerSide' = 'A')::integer,
         count(*) filter (where elem->>'winnerSide' = 'B')::integer
    into next_score_a, next_score_b from jsonb_array_elements(next_racks) elem;

  insert into private.player_match_score_submissions(season_id, player_match_id, tracker_player_id, racks, confirmed_at, updated_at)
  values (target_match.season_id, target_player_match_id, tracker_id, next_racks, null, now())
  on conflict on constraint player_match_score_submission_player_match_id_tracker_playe_key
  do update set racks = excluded.racks, confirmed_at = null, updated_at = now();

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values (actor_user_id, 'player_match.team_score_rack_record', 'player_match', target_player_match_id,
    jsonb_build_object('scoringTeamId', scoring_team_id, 'trackerPlayerId', tracker_id, 'racks', coalesce(existing_submission.racks, '[]'::jsonb)),
    jsonb_build_object('scoringTeamId', scoring_team_id, 'trackerPlayerId', tracker_id, 'racks', next_racks));

  return query select target_player_match_id, scoring_team_id, tracker_id, next_rack_number, rack_discipline,
    rack_winner_side, next_score_a, next_score_b,
    (next_score_a >= target_match.race_to_a or next_score_b >= target_match.race_to_b);
end;
$$;

revoke all on function public.record_player_match_score_rack(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_player_match_score_rack(uuid, uuid, uuid, text) to service_role;

drop function if exists public.undo_player_match_score_rack(uuid, uuid);
create function public.undo_player_match_score_rack(actor_user_id uuid, target_player_match_id uuid, scoring_team_id uuid)
returns table(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, undone_rack_number integer, score_a integer, score_b integer)
language plpgsql security definer set search_path = '' as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  submission private.player_match_score_submissions%rowtype;
  rack_count integer;
  next_racks jsonb;
  next_score_a integer;
  next_score_b integer;
begin
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  select * into target_match from public.player_matches pm where pm.id = target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;
  tracker_id := private.match_tracker_for_scoring_team(actor_user_id, target_match, scoring_team_id);
  select * into submission from private.player_match_score_submissions s
    where s.player_match_id = target_player_match_id and s.tracker_player_id = tracker_id for update;
  if not found or jsonb_array_length(submission.racks) = 0 then raise exception 'Score record has no racks to undo'; end if;
  rack_count := jsonb_array_length(submission.racks);
  next_racks := submission.racks - (rack_count - 1);
  select count(*) filter (where elem->>'winnerSide' = 'A')::integer,
         count(*) filter (where elem->>'winnerSide' = 'B')::integer
    into next_score_a, next_score_b from jsonb_array_elements(next_racks) elem;
  update private.player_match_score_submissions set racks = next_racks, confirmed_at = null, updated_at = now() where id = submission.id;
  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values (actor_user_id, 'player_match.team_score_rack_undo', 'player_match', target_player_match_id,
    jsonb_build_object('scoringTeamId', scoring_team_id, 'trackerPlayerId', tracker_id, 'racks', submission.racks),
    jsonb_build_object('scoringTeamId', scoring_team_id, 'trackerPlayerId', tracker_id, 'racks', next_racks));
  return query select target_player_match_id, scoring_team_id, tracker_id, rack_count, next_score_a, next_score_b;
end; $$;

revoke all on function public.undo_player_match_score_rack(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.undo_player_match_score_rack(uuid, uuid, uuid) to service_role;

drop function if exists public.confirm_player_match_score(uuid, uuid);
create function public.confirm_player_match_score(actor_user_id uuid, target_player_match_id uuid, scoring_team_id uuid)
returns table(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, confirmed_at timestamptz, histories_match boolean, both_confirmed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  submission private.player_match_score_submissions%rowtype;
  opponent_submission private.player_match_score_submissions%rowtype;
  next_score_a integer;
  next_score_b integer;
  confirmed_time timestamptz;
begin
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  select * into target_match from public.player_matches pm where pm.id = target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;
  tracker_id := private.match_tracker_for_scoring_team(actor_user_id, target_match, scoring_team_id);
  select * into submission from private.player_match_score_submissions s
    where s.player_match_id = target_player_match_id and s.tracker_player_id = tracker_id for update;
  if not found or jsonb_array_length(submission.racks) = 0 then raise exception 'Score record is empty'; end if;
  select count(*) filter (where elem->>'winnerSide' = 'A')::integer,
         count(*) filter (where elem->>'winnerSide' = 'B')::integer
    into next_score_a, next_score_b from jsonb_array_elements(submission.racks) elem;
  if next_score_a < target_match.race_to_a and next_score_b < target_match.race_to_b then raise exception 'Race target must be reached before confirmation'; end if;
  confirmed_time := now();
  update private.player_match_score_submissions set confirmed_at = confirmed_time, updated_at = confirmed_time where id = submission.id returning * into submission;
  select * into opponent_submission from private.player_match_score_submissions s
    where s.player_match_id = target_player_match_id and s.tracker_player_id <> tracker_id limit 1;
  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values (actor_user_id, 'player_match.team_score_confirm', 'player_match', target_player_match_id,
    jsonb_build_object('scoringTeamId', scoring_team_id, 'trackerPlayerId', tracker_id),
    jsonb_build_object('scoringTeamId', scoring_team_id, 'trackerPlayerId', tracker_id, 'confirmedAt', confirmed_time));
  return query select target_player_match_id, scoring_team_id, tracker_id, confirmed_time,
    (opponent_submission.id is not null and opponent_submission.racks = submission.racks),
    (opponent_submission.confirmed_at is not null and submission.confirmed_at is not null);
end; $$;

revoke all on function public.confirm_player_match_score(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_player_match_score(uuid, uuid, uuid) to service_role;

drop function if exists public.finalize_reconciled_player_match(uuid, uuid);
create function public.finalize_reconciled_player_match(actor_user_id uuid, target_player_match_id uuid, scoring_team_id uuid)
returns table(player_match_id uuid, status text, winner_side text, winner_player_id uuid, score_a integer, score_b integer, finalized_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  target_match public.player_matches%rowtype;
  finalized_match public.player_matches%rowtype;
  authorized_tracker_id uuid;
  submission_a private.player_match_score_submissions%rowtype;
  submission_b private.player_match_score_submissions%rowtype;
  reconciled_racks jsonb;
  reconciled_score_a integer;
  reconciled_score_b integer;
  resolved_winner_side text;
  resolved_winner_player_id uuid;
  canonical_before jsonb;
begin
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  select * into target_match from public.player_matches pm where pm.id = target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is already finalized'; end if;
  authorized_tracker_id := private.match_tracker_for_scoring_team(actor_user_id, target_match, scoring_team_id);
  if target_match.race_to_a is null or target_match.race_to_b is null then raise exception 'Race targets are required before finalization'; end if;
  select * into submission_a from private.player_match_score_submissions s where s.player_match_id = target_player_match_id and s.tracker_player_id = target_match.player_a_id for update;
  if not found then raise exception 'Both team score records are required before finalization'; end if;
  select * into submission_b from private.player_match_score_submissions s where s.player_match_id = target_player_match_id and s.tracker_player_id = target_match.player_b_id for update;
  if not found then raise exception 'Both team score records are required before finalization'; end if;
  if submission_a.confirmed_at is null or submission_b.confirmed_at is null then raise exception 'Both teams must confirm the reconciled score before finalization'; end if;
  if submission_a.racks is distinct from submission_b.racks or jsonb_array_length(submission_a.racks) = 0 then raise exception 'Team score histories must match before finalization'; end if;
  reconciled_racks := submission_a.racks;
  if exists (select 1 from jsonb_array_elements(reconciled_racks) with ordinality as rack(value, ordinality)
    where coalesce(rack.value ->> 'winnerSide', '') not in ('A', 'B')
       or nullif(rack.value ->> 'rackNumber', '')::integer is distinct from rack.ordinality::integer
       or coalesce(rack.value ->> 'discipline', '') is distinct from (case when rack.ordinality <= target_match.opening_block_length then target_match.opening_discipline when target_match.opening_discipline = '8-ball' then '9-ball' else '8-ball' end))
    then raise exception 'Reconciled rack history is invalid'; end if;
  select count(*) filter (where rack.value ->> 'winnerSide' = 'A')::integer,
         count(*) filter (where rack.value ->> 'winnerSide' = 'B')::integer
    into reconciled_score_a, reconciled_score_b from jsonb_array_elements(reconciled_racks) as rack(value);
  if reconciled_score_a >= target_match.race_to_a and reconciled_score_b >= target_match.race_to_b then raise exception 'Reconciled score cannot have both players reach the race target'; end if;
  if reconciled_score_a < target_match.race_to_a and reconciled_score_b < target_match.race_to_b then raise exception 'Race target must be reached before finalization'; end if;
  if reconciled_score_a >= target_match.race_to_a then resolved_winner_side := 'A'; resolved_winner_player_id := target_match.player_a_id;
  else resolved_winner_side := 'B'; resolved_winner_player_id := target_match.player_b_id; end if;
  select coalesce(jsonb_agg(jsonb_build_object('rackNumber', pmr.rack_number,'discipline', pmr.discipline,'winnerSide', pmr.winner_side,'winnerPlayerId', pmr.winner_player_id,'recordedBy', pmr.recorded_by,'recordedAt', pmr.recorded_at) order by pmr.rack_number),'[]'::jsonb)
    into canonical_before from public.player_match_racks pmr where pmr.player_match_id = target_player_match_id;
  delete from public.player_match_racks pmr where pmr.player_match_id = target_player_match_id;
  insert into public.player_match_racks(season_id, player_match_id, rack_number, discipline, winner_side, winner_player_id, recorded_by)
  select target_match.season_id, target_player_match_id, rack.ordinality::integer, rack.value ->> 'discipline', rack.value ->> 'winnerSide',
    case when rack.value ->> 'winnerSide' = 'A' then target_match.player_a_id else target_match.player_b_id end, actor_user_id
  from jsonb_array_elements(reconciled_racks) with ordinality as rack(value, ordinality) order by rack.ordinality;
  update public.player_matches set score_a = reconciled_score_a, score_b = reconciled_score_b, winner_side = resolved_winner_side,
    winner_player_id = resolved_winner_player_id, status = 'finalized', finalized_by = actor_user_id, finalized_at = now()
  where player_matches.id = target_player_match_id returning * into finalized_match;
  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values (actor_user_id, 'player_match.finalize_reconciled', 'player_match', target_player_match_id,
    jsonb_build_object('match', to_jsonb(target_match),'canonicalRacks', canonical_before,'teamASubmission', to_jsonb(submission_a),'teamBSubmission', to_jsonb(submission_b),'scoringTeamId',scoring_team_id),
    jsonb_build_object('match', to_jsonb(finalized_match),'reconciledRacks', reconciled_racks,'scoringTeamId',scoring_team_id));
  return query select finalized_match.id, finalized_match.status, finalized_match.winner_side, finalized_match.winner_player_id,
    finalized_match.score_a, finalized_match.score_b, finalized_match.finalized_at;
end; $$;

revoke all on function public.finalize_reconciled_player_match(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.finalize_reconciled_player_match(uuid, uuid, uuid) to service_role;

drop function if exists public.list_scorable_player_matches(uuid);
create function public.list_scorable_player_matches(actor_user_id uuid)
returns table(player_match_id uuid, season_id uuid, season_name text, round_id uuid, round_number integer, scheduled_on date,
  team_match_id uuid, slot_number integer, status text, team_a_name text, team_b_name text, player_a_name text, player_b_name text,
  scoring_team_id uuid, scoring_team_name text, editable_side text)
language sql stable security definer set search_path = '' as $$
  with actor as (
    select p.id as player_id from public.players p where p.user_id = actor_user_id limit 1
  )
  select pm.id, pm.season_id, s.name, pm.round_id, r.round_number, r.scheduled_on, pm.team_match_id, pm.slot_number, pm.status,
    ta.name, tb.name, pa.display_name, pb.display_name, tm.team_id,
    case when tm.team_id = pm.team_a_id then ta.name else tb.name end,
    case when tm.team_id = pm.team_a_id then 'A' else 'B' end
  from public.player_matches pm
  join actor a on true
  join public.team_memberships tm on tm.player_id = a.player_id and tm.season_id = pm.season_id and tm.ends_at is null
    and tm.team_id in (pm.team_a_id, pm.team_b_id)
  join public.seasons s on s.id = pm.season_id
  join public.rounds r on r.id = pm.round_id
  join public.teams ta on ta.id = pm.team_a_id
  join public.teams tb on tb.id = pm.team_b_id
  join public.players pa on pa.id = pm.player_a_id
  join public.players pb on pb.id = pm.player_b_id
  where pm.status not in ('finalized', 'corrected')
  order by case when r.scheduled_on >= current_date then 0 else 1 end, abs(r.scheduled_on - current_date), r.round_number, pm.slot_number, tm.team_id;
$$;

revoke all on function public.list_scorable_player_matches(uuid) from public, anon, authenticated;
grant execute on function public.list_scorable_player_matches(uuid) to service_role;
