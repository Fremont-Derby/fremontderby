-- JFL hotfix: checked rack edits must expose the same row shape as the underlying edit RPC.
-- PostgreSQL raises "structure of query does not match function result type" when
-- a wrapper declares columns the delegated function does not return.

drop function if exists public.update_player_match_score_rack_checked(
  uuid,
  uuid,
  uuid,
  integer,
  text,
  jsonb
);

create function public.update_player_match_score_rack_checked(
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
  score_b integer
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;

  if not found then
    raise exception 'Player match not found';
  end if;

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
