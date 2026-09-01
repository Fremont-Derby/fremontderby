-- #1955: a captain may revise their submitted lineup until both captains submit.
-- Also expose only the opponent submission fact before reveal; player/order data
-- remains masked until both lineups exist.
do $migration$
declare
  definition text;
  rewritten text;
  old_guard text := $old$  if exists (
    select 1
    from private.team_lineups existing_lineup
    where existing_lineup.team_match_id = target_match.id
      and existing_lineup.team_id = target_team_id
  ) then
    raise exception 'Lineup is locked after submission';
  end if;

$old$;
  new_guard text := $new$  if exists (
    select 1
    from private.team_lineups own_lineup
    where own_lineup.team_match_id = target_match.id
      and own_lineup.team_id = target_team_id
  ) and exists (
    select 1
    from private.team_lineups opponent_lineup
    where opponent_lineup.team_match_id = target_match.id
      and opponent_lineup.team_id <> target_team_id
  ) then
    raise exception 'Both captains have submitted; lineup is locked';
  end if;

$new$;
  old_projection text := $old_projection$    tls.slot_number,
    tls.player_id,
    tls.participation_type,
    tl.submitted_at
$old_projection$;
  new_projection text := $new_projection$    case
      when tl.team_id = target_team_id or opponent_visible then tls.slot_number
      else 0
    end as slot_number,
    case
      when tl.team_id = target_team_id or opponent_visible then tls.player_id
      else null
    end as player_id,
    case
      when tl.team_id = target_team_id or opponent_visible then tls.participation_type
      else null
    end as participation_type,
    tl.submitted_at
$new_projection$;
  old_filter text := $old_filter$  where tl.team_match_id = target_match.id
    and (
      tl.team_id = target_team_id
      or opponent_visible
    )
$old_filter$;
  new_filter text := $new_filter$  where tl.team_match_id = target_match.id
$new_filter$;
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

  if position(new_guard in definition) = 0 then
    if position(old_guard in definition) = 0 then
      raise exception 'submit_team_lineup lock guard not recognized';
    end if;
    rewritten := replace(definition, old_guard, new_guard);
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

  rewritten := definition;
  if position(new_projection in rewritten) = 0 then
    if position(old_projection in rewritten) = 0 then
      raise exception 'list_visible_team_lineups projection not recognized';
    end if;
    rewritten := replace(rewritten, old_projection, new_projection);
  end if;

  if position(new_filter in rewritten) = 0 or position(old_filter in rewritten) > 0 then
    if position(old_filter in rewritten) = 0 then
      raise exception 'list_visible_team_lineups filter not recognized';
    end if;
    rewritten := replace(rewritten, old_filter, new_filter);
  end if;

  if rewritten is distinct from definition then
    execute rewritten;
  end if;
end;
$migration$;

comment on function public.submit_team_lineup(uuid, uuid, uuid, jsonb) is
  'Service-role-only captain boundary. A submitted lineup may be replaced until both captains submit; then both are immutable.';

comment on function public.list_visible_team_lineups(uuid, uuid, uuid) is
  'Captain read model. Opponent submission presence is visible immediately, but opponent slot/player/order data remains masked until both captains submit.';
