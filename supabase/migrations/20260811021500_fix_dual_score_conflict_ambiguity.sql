do $migration$
declare
  definition text;
  rewritten text;
begin
  select pg_get_functiondef(p.oid)
    into definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'record_player_match_score_rack'
    and p.prokind = 'f';

  if definition is null then
    raise exception 'record_player_match_score_rack function not found';
  end if;

  if position('on conflict on constraint player_match_score_submission_player_match_id_tracker_playe_key' in lower(definition)) > 0 then
    return;
  end if;

  if position('on conflict (player_match_id, tracker_player_id)' in lower(definition)) = 0 then
    raise exception 'record_player_match_score_rack conflict target not recognized';
  end if;

  rewritten := replace(
    definition,
    'on conflict (player_match_id, tracker_player_id)',
    'on conflict on constraint player_match_score_submission_player_match_id_tracker_playe_key'
  );

  execute rewritten;
end;
$migration$;