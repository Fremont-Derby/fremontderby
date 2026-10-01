-- When the last regular-season player race is finalized, mark the team matchup finalized.

create or replace function private.maybe_finalize_team_match_from_player_matches()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  target_team_match_id uuid;
  done_slots integer;
  wins_a integer;
  wins_b integer;
  team_a uuid;
  team_b uuid;
  winner uuid;
  stage text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status and new.winner_side is not distinct from old.winner_side then
    return new;
  end if;
  if new.status not in ('finalized', 'corrected') then
    return new;
  end if;

  target_team_match_id := new.team_match_id;
  select tm.team_a_id, tm.team_b_id, r.stage
    into team_a, team_b, stage
  from public.team_matches tm
  join public.rounds r on r.id = tm.round_id
  where tm.id = target_team_match_id;

  if not found then
    return new;
  end if;
  if stage is distinct from 'regular' then
    return new;
  end if;

  select count(*)::integer into done_slots
  from public.player_matches pm
  where pm.team_match_id = target_team_match_id
    and pm.status in ('finalized', 'corrected')
    and pm.winner_side in ('A', 'B');

  if done_slots < 3 then
    return new;
  end if;

  select
    count(*) filter (where pm.winner_side = 'A')::integer,
    count(*) filter (where pm.winner_side = 'B')::integer
  into wins_a, wins_b
  from public.player_matches pm
  where pm.team_match_id = target_team_match_id
    and pm.status in ('finalized', 'corrected')
    and pm.winner_side in ('A', 'B');

  winner := case
    when wins_a > wins_b then team_a
    when wins_b > wins_a then team_b
    else null
  end;

  update public.team_matches
  set status = 'finalized',
      winner_team_id = winner
  where id = target_team_match_id
    and status is distinct from 'finalized';

  return new;
end;
$function$;

drop trigger if exists maybe_finalize_team_match_after_player_match on public.player_matches;
create trigger maybe_finalize_team_match_after_player_match
after update of status, winner_side on public.player_matches
for each row
execute function private.maybe_finalize_team_match_from_player_matches();

comment on function private.maybe_finalize_team_match_from_player_matches() is
  'After player race finalize/correct, finalize regular team matchup when all three slots have winners.';
