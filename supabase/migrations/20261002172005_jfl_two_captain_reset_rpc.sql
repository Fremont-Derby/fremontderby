-- Service-role-only, invoker-rights reset for the fixed JFL QA Persona Lab.
-- A hosted preflight uses this RPC; the persistent browser runner gets no key.
create or replace function jfl.reset_two_captain_qa()
returns table(team_match_id uuid, reset_lineups integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_match_id constant uuid := '18580000-1300-4000-8000-000000000001';
  removed_lineups integer := 0;
begin
  if to_regnamespace('jfl') is null or to_regnamespace('jfl_private') is null then
    raise exception 'JFL isolated schemas are required';
  end if;
  if not exists (
    select 1 from jfl.team_matches tm
    join jfl.seasons s on s.id = tm.season_id
    where tm.id = target_match_id
      and tm.season_id = '18580000-1000-4000-8000-000000000000'
      and tm.round_id = '18580000-1200-4000-8000-000000000001'
      and tm.team_a_id = '18580000-1100-4000-8000-000000000001'
      and tm.team_b_id = '18580000-1100-4000-8000-000000000002'
      and s.purpose = 'qa'
  ) then
    raise exception 'The exact JFL two-captain QA matchup is required';
  end if;

  delete from jfl_private.player_match_score_submissions s
  using jfl.player_matches pm
  where pm.team_match_id = target_match_id and s.player_match_id = pm.id;

  delete from jfl.player_match_racks r
  using jfl.player_matches pm
  where pm.team_match_id = target_match_id and r.player_match_id = pm.id;

  delete from jfl.player_matches pm where pm.team_match_id = target_match_id;
  delete from jfl.team_match_forfeits f where f.team_match_id = target_match_id;
  delete from jfl_private.team_lineups l where l.team_match_id = target_match_id;
  get diagnostics removed_lineups = row_count;
  delete from jfl_private.team_match_player_choices c where c.team_match_id = target_match_id;

  update jfl.team_matches tm
  set status = 'scheduled', winner_team_id = null
  where tm.id = target_match_id;

  if exists (select 1 from jfl_private.team_lineups l where l.team_match_id = target_match_id)
    or exists (select 1 from jfl.player_matches pm where pm.team_match_id = target_match_id)
    or exists (select 1 from jfl.team_match_forfeits f where f.team_match_id = target_match_id)
    or not exists (
      select 1 from jfl.team_matches tm
      where tm.id = target_match_id and tm.status = 'scheduled' and tm.winner_team_id is null
    ) then
    raise exception 'JFL two-captain QA reset did not reach its clean state';
  end if;

  return query select target_match_id, removed_lineups;
end;
$$;

revoke all on function jfl.reset_two_captain_qa() from public, anon, authenticated;
grant execute on function jfl.reset_two_captain_qa() to service_role;

comment on function jfl.reset_two_captain_qa() is
  'Reset only the fixed JFL QA two-captain matchup before a trusted browser run.';
