-- Defense in depth: refuse score tracker resolution when actor is active on both
-- clubs in the same team matchup (legacy dual-roster / admin mistakes).

create or replace function private.match_tracker_for_scoring_team(
  actor_user_id uuid,
  target_match public.player_matches,
  target_scoring_team_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  actor_player_id uuid;
  dual_count integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_scoring_team_id is null then raise exception 'scoring_team_id is required'; end if;
  if target_scoring_team_id not in (target_match.team_a_id, target_match.team_b_id) then
    raise exception 'Scoring team is not part of this player match';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id
  limit 1;

  if actor_player_id is null
     or not exists (
       select 1 from public.team_memberships tm
       where tm.player_id = actor_player_id
         and tm.season_id = target_match.season_id
         and tm.team_id = target_scoring_team_id
         and tm.ends_at is null
     ) then
    raise exception 'Actor is not an active member of the scoring team';
  end if;

  select count(*)::integer into dual_count
  from public.team_memberships tm
  where tm.player_id = actor_player_id
    and tm.season_id = target_match.season_id
    and tm.ends_at is null
    and tm.team_id in (target_match.team_a_id, target_match.team_b_id);

  if dual_count > 1 then
    raise exception 'Actor cannot score this match while active on both teams in the matchup';
  end if;

  return case
    when target_scoring_team_id = target_match.team_a_id then target_match.player_a_id
    else target_match.player_b_id
  end;
end;
$function$;

comment on function private.match_tracker_for_scoring_team(uuid, public.player_matches, uuid) is
  'Resolve editable tracker side from scoring team membership; reject dual-team actors in the matchup.';
