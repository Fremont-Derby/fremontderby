-- team_matches gained makeup_* columns after list_team_standings_internal was defined.
-- The complete_team_matches CTE grouped an incomplete column list → 42803 at runtime
-- and Cloudflare Worker 1101 on GET /api/seasons/:id/team-standings.
-- Patch every schema that defines list_team_standings_internal (public + lanes).

do $patch$
declare
  r record;
  def text;
  old_gb text := $gb$group by rtm.id, rtm.season_id, rtm.round_id, rtm.table_number, rtm.team_a_id, rtm.team_b_id,
      rtm.status, rtm.winner_team_id, rtm.created_at$gb$;
  new_gb text := $gb$group by rtm.id, rtm.season_id, rtm.round_id, rtm.table_number, rtm.team_a_id, rtm.team_b_id,
      rtm.status, rtm.winner_team_id, rtm.created_at,
      rtm.makeup_on, rtm.makeup_location, rtm.makeup_status, rtm.makeup_note, rtm.makeup_proposed_by_team_id$gb$;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'list_team_standings_internal'
  loop
    def := pg_get_functiondef(r.oid);
    if position(old_gb in def) > 0 then
      execute replace(def, old_gb, new_gb);
    end if;
  end loop;
end;
$patch$;

notify pgrst, 'reload schema';
