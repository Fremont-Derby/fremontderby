-- #2802: reset only the deterministic JFL two-captain QA matchup for #2799.
-- Run in the shared non-production staging project, never in production.
-- Browser tests must still use the supported UI/API for all league actions.

begin;

do $$
begin
  if to_regnamespace('jfl') is null or to_regnamespace('jfl_private') is null then
    raise exception 'JFL isolated schemas are required';
  end if;
  if not exists (
    select 1
    from jfl.team_matches tm
    join jfl.seasons s on s.id = tm.season_id
    where tm.id = '18580000-1300-4000-8000-000000000001'
      and tm.season_id = '18580000-1000-4000-8000-000000000000'
      and tm.round_id = '18580000-1200-4000-8000-000000000001'
      and tm.team_a_id = '18580000-1100-4000-8000-000000000001'
      and tm.team_b_id = '18580000-1100-4000-8000-000000000002'
      and s.purpose = 'qa'
  ) then
    raise exception 'The exact JFL two-captain QA matchup is required';
  end if;
end
$$;

-- Delete score records explicitly before their generated parent matches.
delete from jfl_private.player_match_score_submissions s
using jfl.player_matches pm
where pm.team_match_id = '18580000-1300-4000-8000-000000000001'
  and s.player_match_id = pm.id;

delete from jfl.player_match_racks r
using jfl.player_matches pm
where pm.team_match_id = '18580000-1300-4000-8000-000000000001'
  and r.player_match_id = pm.id;

delete from jfl.player_matches
where team_match_id = '18580000-1300-4000-8000-000000000001';

delete from jfl.team_match_forfeits
where team_match_id = '18580000-1300-4000-8000-000000000001';

-- Cascading slot removal cannot rebuild a matchup while its lineup parent
-- has already gone. The fixture retains its published round and roster.
delete from jfl_private.team_lineups
where team_match_id = '18580000-1300-4000-8000-000000000001';

delete from jfl_private.team_match_player_choices
where team_match_id = '18580000-1300-4000-8000-000000000001';

update jfl.team_matches
set status = 'scheduled', winner_team_id = null
where id = '18580000-1300-4000-8000-000000000001';

do $$
begin
  if exists (
    select 1 from jfl_private.team_lineups
    where team_match_id = '18580000-1300-4000-8000-000000000001'
  ) or exists (
    select 1 from jfl.player_matches
    where team_match_id = '18580000-1300-4000-8000-000000000001'
  ) or exists (
    select 1 from jfl.team_match_forfeits
    where team_match_id = '18580000-1300-4000-8000-000000000001'
  ) or not exists (
    select 1 from jfl.team_matches
    where id = '18580000-1300-4000-8000-000000000001'
      and status = 'scheduled'
      and winner_team_id is null
  ) then
    raise exception 'JFL two-captain QA reset did not reach its clean state';
  end if;
end
$$;

commit;
