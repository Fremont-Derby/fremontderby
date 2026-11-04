-- #1955: allow a captain to explicitly unsubmit/unlock their own lineup
-- while the opponent is still waiting. An empty lineup_slots array is the
-- authenticated unlock signal on the existing submit_team_lineup boundary.
do $migration$
declare
  definition text;
  rewritten text;
  guard_fragment text := $guard$  if exists (
    select 1 from jfl_private.team_lineups own_lineup
    where own_lineup.team_match_id = target_match.id and own_lineup.team_id = target_team_id
  ) and exists (
    select 1 from jfl_private.team_lineups opponent_lineup
    where opponent_lineup.team_match_id = target_match.id and opponent_lineup.team_id <> target_team_id
  ) then raise exception 'Both captains have submitted; lineup is locked'; end if;
$guard$;
  unlock_fragment text := $unlock$

  -- The browser uses [] only for the explicit Unlock lineup action. Keep the
  -- captain/match/deadline/lock checks above this point, then remove the saved
  -- submission entirely so refresh correctly returns the team to Waiting.
  if jsonb_array_length(lineup_slots) = 0 then
    delete from jfl_private.team_lineup_slots tls
    using jfl_private.team_lineups tl
    where tls.lineup_id = tl.id
      and tl.team_match_id = target_match.id
      and tl.team_id = target_team_id;

    delete from jfl_private.team_lineups tl
    where tl.team_match_id = target_match.id
      and tl.team_id = target_team_id;

    return;
  end if;
$unlock$;
begin
  select pg_get_functiondef(p.oid) into definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'jfl'
    and p.proname = 'submit_team_lineup'
    and p.prokind = 'f';

  if definition is null then
    raise exception 'jfl.submit_team_lineup function not found';
  end if;

  if position(unlock_fragment in definition) > 0 then
    return;
  end if;

  if position(guard_fragment in definition) = 0 then
    raise exception 'JFL submit_team_lineup lock guard not recognized';
  end if;

  rewritten := replace(definition, guard_fragment, guard_fragment || unlock_fragment);
  execute rewritten;
end;
$migration$;

comment on function jfl.submit_team_lineup(uuid, uuid, uuid, jsonb) is
  'JFL captain boundary. Three slots submit/update a lineup; [] explicitly unlocks/removes the captain submission while the opponent is still waiting. Both-submitted lineups are immutable.';
