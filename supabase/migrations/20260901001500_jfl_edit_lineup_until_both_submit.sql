-- #1955: JFL uses lane-local RPCs/tables. Reconcile the edit-until-both
-- lineup contract into the JFL schema while keeping opponent details masked
-- until both captains submit.
do $migration$
declare
  definition text;
  rewritten text;
  old_guard text := $old$  if exists (
    select 1 from jfl_private.team_lineups existing_lineup
    where existing_lineup.team_match_id = target_match.id and existing_lineup.team_id = target_team_id
  ) then raise exception 'Lineup is locked after submission'; end if;
$old$;
  new_guard text := $new$  if exists (
    select 1 from jfl_private.team_lineups own_lineup
    where own_lineup.team_match_id = target_match.id and own_lineup.team_id = target_team_id
  ) and exists (
    select 1 from jfl_private.team_lineups opponent_lineup
    where opponent_lineup.team_match_id = target_match.id and opponent_lineup.team_id <> target_team_id
  ) then raise exception 'Both captains have submitted; lineup is locked'; end if;
$new$;
  old_projection text := 'return query select tl.id,tl.season_id,tl.round_id,tl.team_match_id,tl.team_id,tl.team_id=target_team_id,opponent_visible,tls.slot_number,tls.player_id,p.display_name,pr.fargo_rating,pr.rating_status,tls.participation_type,tl.submitted_at';
  new_projection text := 'return query select tl.id,tl.season_id,tl.round_id,tl.team_match_id,tl.team_id,tl.team_id=target_team_id,opponent_visible,case when tl.team_id=target_team_id or opponent_visible then tls.slot_number else 0 end,case when tl.team_id=target_team_id or opponent_visible then tls.player_id else null end,case when tl.team_id=target_team_id or opponent_visible then p.display_name else null end,case when tl.team_id=target_team_id or opponent_visible then pr.fargo_rating else null end,case when tl.team_id=target_team_id or opponent_visible then pr.rating_status else null end,case when tl.team_id=target_team_id or opponent_visible then tls.participation_type else null end,tl.submitted_at';
  old_filter text := 'where tl.team_match_id=target_match.id and (tl.team_id=target_team_id or opponent_visible)';
  new_filter text := 'where tl.team_match_id=target_match.id';
begin
  select pg_get_functiondef(p.oid) into definition
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='jfl' and p.proname='submit_team_lineup' and p.prokind='f';

  if definition is null then raise exception 'jfl.submit_team_lineup function not found'; end if;
  if position(new_guard in definition)=0 then
    if position(old_guard in definition)=0 then raise exception 'JFL submit_team_lineup lock guard not recognized'; end if;
    execute replace(definition,old_guard,new_guard);
  end if;

  select pg_get_functiondef(p.oid) into definition
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='jfl' and p.proname='list_visible_team_lineups' and p.prokind='f';

  if definition is null then raise exception 'jfl.list_visible_team_lineups function not found'; end if;
  rewritten := definition;
  if position(new_projection in rewritten)=0 then
    if position(old_projection in rewritten)=0 then raise exception 'JFL list_visible_team_lineups projection not recognized'; end if;
    rewritten := replace(rewritten,old_projection,new_projection);
  end if;
  if position(new_filter in rewritten)=0 or position(old_filter in rewritten)>0 then
    if position(old_filter in rewritten)=0 then raise exception 'JFL list_visible_team_lineups filter not recognized'; end if;
    rewritten := replace(rewritten,old_filter,new_filter);
  end if;
  if rewritten is distinct from definition then execute rewritten; end if;
end;
$migration$;

comment on function jfl.submit_team_lineup(uuid,uuid,uuid,jsonb) is
  'JFL captain boundary. Own lineup may be replaced until both captains submit; then both are immutable.';
comment on function jfl.list_visible_team_lineups(uuid,uuid,uuid) is
  'JFL captain read model. Opponent submission presence is visible immediately; opponent identity/order/rating data remains masked until both captains submit.';
