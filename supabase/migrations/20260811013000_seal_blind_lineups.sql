do $migration$
declare
  definition text;
  rewritten text;
  slot_validation_marker text := $marker$  if exists (
    select 1
    from (
      select
        coalesce((slot_item.value ->> 'slotNumber')::integer, slot_item.ordinality::integer) as slot_number
$marker$;
  lock_guard text := $guard$  if exists (
    select 1
    from private.team_lineups existing_lineup
    where existing_lineup.team_match_id = target_match.id
      and existing_lineup.team_id = target_team_id
  ) then
    raise exception 'Lineup is locked after submission';
  end if;

$guard$;
  old_visibility text := $old$  opponent_visible := (
    exists (select 1 from private.team_lineups home_lineup where home_lineup.team_match_id = target_match.id and home_lineup.team_id = target_match.team_a_id)
    and exists (select 1 from private.team_lineups away_lineup where away_lineup.team_match_id = target_match.id and away_lineup.team_id = target_match.team_b_id)
  ) or (target_round.lineup_deadline_at is not null and now() > target_round.lineup_deadline_at);
$old$;
  new_visibility text := $new$  opponent_visible := (
    exists (select 1 from private.team_lineups home_lineup where home_lineup.team_match_id = target_match.id and home_lineup.team_id = target_match.team_a_id)
    and exists (select 1 from private.team_lineups away_lineup where away_lineup.team_match_id = target_match.id and away_lineup.team_id = target_match.team_b_id)
  );
$new$;
begin
  select pg_get_functiondef(p.oid)
    into definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'submit_team_lineup'
    and p.prokind = 'f';

  if definition is null then
    raise exception 'submit_team_lineup function not found';
  end if;

  if position('Lineup is locked after submission' in definition) = 0 then
    if position(slot_validation_marker in definition) = 0 then
      raise exception 'submit_team_lineup slot validation marker not found';
    end if;

    rewritten := replace(
      definition,
      slot_validation_marker,
      lock_guard || slot_validation_marker
    );
    execute rewritten;
  end if;

  select pg_get_functiondef(p.oid)
    into definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'list_visible_team_lineups'
    and p.prokind = 'f';

  if definition is null then
    raise exception 'list_visible_team_lineups function not found';
  end if;

  if position(old_visibility in definition) > 0 then
    rewritten := replace(definition, old_visibility, new_visibility);
    execute rewritten;
  elsif position(new_visibility in definition) = 0 then
    raise exception 'list_visible_team_lineups visibility contract not recognized';
  end if;
end;
$migration$;
