-- #1955: keep JFL lineup picker and submit-time eligibility on the same source.
-- The picker uses player_date_availability + active season_players for substitutes;
-- submit_team_lineup still checked only legacy round-specific availability caches.
do $migration$
declare
  definition text;
  rewritten text;
  old_fragment text := $old$      or exists (
        select 1 from jfl_private.roster_availability ra
        where ra.season_id = target_match.season_id and ra.round_id = target_round_id
          and ra.player_id = parsed_slots.player_id and ra.status = 'available'
          and exists (
            select 1 from jfl.team_memberships other_tm
            where other_tm.season_id = target_match.season_id
              and other_tm.player_id = parsed_slots.player_id and other_tm.ends_at is null
          )
      )
$old$;
  new_fragment text := $new$      or exists (
        select 1 from jfl_private.roster_availability ra
        where ra.season_id = target_match.season_id and ra.round_id = target_round_id
          and ra.player_id = parsed_slots.player_id and ra.status = 'available'
          and exists (
            select 1 from jfl.team_memberships other_tm
            where other_tm.season_id = target_match.season_id
              and other_tm.player_id = parsed_slots.player_id and other_tm.ends_at is null
          )
      )
      or exists (
        select 1
        from jfl.season_players sp
        join jfl_private.player_date_availability pda
          on pda.season_id = sp.season_id
         and pda.player_id = sp.player_id
         and pda.availability_date = target_round.scheduled_on
         and pda.status = 'available'
        where sp.season_id = target_match.season_id
          and sp.player_id = parsed_slots.player_id
          and sp.status = 'active'
      )
$new$;
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

  if position(new_fragment in definition) > 0 then
    return;
  end if;

  if position(old_fragment in definition) = 0 then
    raise exception 'JFL submit_team_lineup substitute eligibility fragment not recognized';
  end if;

  rewritten := replace(definition, old_fragment, new_fragment);
  execute rewritten;
end;
$migration$;

comment on function jfl.submit_team_lineup(uuid, uuid, uuid, jsonb) is
  'JFL captain boundary. Submit eligibility matches the picker: own roster or an active season player explicitly Available for the round date; own lineup stays editable until both captains submit.';
