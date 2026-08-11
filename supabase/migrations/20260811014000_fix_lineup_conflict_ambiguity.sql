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
    and p.proname = 'submit_team_lineup'
    and p.prokind = 'f';

  if definition is null then
    raise exception 'submit_team_lineup function not found';
  end if;

  if position('on conflict on constraint team_lineups_team_match_id_team_id_key' in lower(definition)) > 0 then
    return;
  end if;

  if position('on conflict (team_match_id, team_id)' in lower(definition)) = 0 then
    raise exception 'submit_team_lineup conflict target not recognized';
  end if;

  rewritten := replace(
    definition,
    'on conflict (team_match_id, team_id)',
    'on conflict on constraint team_lineups_team_match_id_team_id_key'
  );

  execute rewritten;
end;
$migration$;
