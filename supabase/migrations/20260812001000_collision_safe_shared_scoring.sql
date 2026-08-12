create or replace function private.assert_expected_score_history(
  target_player_match_id uuid,
  target_tracker_player_id uuid,
  expected_racks jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_racks jsonb;
begin
  if expected_racks is null or jsonb_typeof(expected_racks) <> 'array' then
    raise exception 'expected_racks must be an array';
  end if;

  select coalesce(s.racks, '[]'::jsonb)
    into current_racks
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = target_tracker_player_id
  for update;

  if current_racks is null then
    current_racks := '[]'::jsonb;
  end if;

  if current_racks is distinct from expected_racks then
    raise exception 'Score changed on another device';
  end if;

  return current_racks;
end;
$$;

revoke all on function private.assert_expected_score_history(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function private.assert_expected_score_history(uuid, uuid, jsonb)
  to service_role;

create or replace function public.record_player_match_score_rack_checked(
  actor_user_id uuid,
  target_player_match_id uuid,
  target_scoring_team_id uuid,
  rack_winner_side text,
  expected_racks jsonb
)
returns table(
  player_match_id uuid,
  scoring_team_id uuid,
  tracker_player_id uuid,
  rack_number integer,
  discipline text,
  winner_side text,
  score_a integer,
  score_b integer,
  record_complete boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;

  tracker_id := private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform private.assert_expected_score_history(
    target_player_match_id,
    tracker_id,
    expected_racks
  );

  return query
  select * from public.record_player_match_score_rack(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id,
    rack_winner_side
  );
end;
$$;

revoke all on function public.record_player_match_score_rack_checked(uuid, uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_player_match_score_rack_checked(uuid, uuid, uuid, text, jsonb)
  to service_role;

create or replace function public.update_player_match_score_rack_checked(
  actor_user_id uuid,
  target_player_match_id uuid,
  target_scoring_team_id uuid,
  target_rack_number integer,
  rack_winner_side text,
  expected_racks jsonb
)
returns table(
  player_match_id uuid,
  scoring_team_id uuid,
  tracker_player_id uuid,
  rack_number integer,
  discipline text,
  previous_winner_side text,
  winner_side text,
  score_a integer,
  score_b integer,
  record_complete boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;

  tracker_id := private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform private.assert_expected_score_history(
    target_player_match_id,
    tracker_id,
    expected_racks
  );

  return query
  select * from public.update_player_match_score_rack(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id,
    target_rack_number,
    rack_winner_side
  );
end;
$$;

revoke all on function public.update_player_match_score_rack_checked(uuid, uuid, uuid, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.update_player_match_score_rack_checked(uuid, uuid, uuid, integer, text, jsonb)
  to service_role;

create or replace function public.undo_player_match_score_rack_checked(
  actor_user_id uuid,
  target_player_match_id uuid,
  target_scoring_team_id uuid,
  expected_racks jsonb
)
returns table(
  player_match_id uuid,
  scoring_team_id uuid,
  tracker_player_id uuid,
  undone_rack_number integer,
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
begin
  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;

  tracker_id := private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform private.assert_expected_score_history(
    target_player_match_id,
    tracker_id,
    expected_racks
  );

  return query
  select * from public.undo_player_match_score_rack(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id
  );
end;
$$;

revoke all on function public.undo_player_match_score_rack_checked(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.undo_player_match_score_rack_checked(uuid, uuid, uuid, jsonb)
  to service_role;

create or replace function public.confirm_player_match_score_checked(
  actor_user_id uuid,
  target_player_match_id uuid,
  target_scoring_team_id uuid,
  expected_racks jsonb
)
returns table(
  player_match_id uuid,
  scoring_team_id uuid,
  tracker_player_id uuid,
  confirmed_at timestamptz,
  histories_match boolean,
  both_confirmed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;

  tracker_id := private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform private.assert_expected_score_history(
    target_player_match_id,
    tracker_id,
    expected_racks
  );

  return query
  select * from public.confirm_player_match_score(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id
  );
end;
$$;

revoke all on function public.confirm_player_match_score_checked(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirm_player_match_score_checked(uuid, uuid, uuid, jsonb)
  to service_role;

comment on function public.record_player_match_score_rack_checked(uuid, uuid, uuid, text, jsonb) is
  'Collision-safe rack append. Rejects when the caller scored from stale same-team rack history.';
comment on function public.update_player_match_score_rack_checked(uuid, uuid, uuid, integer, text, jsonb) is
  'Collision-safe surgical rack edit. Rejects stale same-team rack history before mutation.';
comment on function public.undo_player_match_score_rack_checked(uuid, uuid, uuid, jsonb) is
  'Collision-safe rack undo. Rejects stale same-team rack history before mutation.';
comment on function public.confirm_player_match_score_checked(uuid, uuid, uuid, jsonb) is
  'Collision-safe team score confirmation. Confirms exactly the rack history the caller reviewed.';
