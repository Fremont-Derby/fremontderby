-- #1917: normalize JFL mock season data for human validation.
-- JFL only. Do not run against public, gamma, or dru schemas.
--
-- Desired normal league surface:
--   * Legacy Season   -> complete historical reference season
--   * Upcoming Season -> registration/pending season with 8 full rosters
-- Specialized test fixtures remain purpose='qa' and stay off normal league surfaces.

begin;

update jfl.seasons
set purpose = 'qa'
where name in ('Season 1', 'JFL QA — Active League Lab');

update jfl.seasons
set name = 'Legacy Season',
    purpose = 'league',
    status = 'complete'
where name = 'JFL QA — Completed Archive';

update jfl.seasons
set name = 'Upcoming Season',
    purpose = 'league',
    status = 'registration'
where name = 'JFL QA — Registration Lab';

-- Complete the one intentionally short registration roster with already-registered mock players.
insert into jfl.team_memberships (season_id, team_id, player_id, role)
select s.id, t.id, p.id, 'player'
from jfl.seasons s
join jfl.teams t
  on t.season_id = s.id
 and t.name = 'JFL QA Bank Shots'
join jfl.players p
  on p.display_name in ('JFL Mock Player 26', 'JFL Mock Player 27')
where s.name = 'Upcoming Season'
  and not exists (
    select 1
    from jfl.team_memberships tm
    where tm.season_id = s.id
      and tm.team_id = t.id
      and tm.player_id = p.id
      and tm.ends_at is null
  );

-- The pending fixture should have one captain on every four-player roster.
-- These selected players are not captains in the other JFL fixtures.
update jfl.team_memberships tm
set role = 'captain'
from jfl.teams t, jfl.seasons s, jfl.players p
where s.name = 'Upcoming Season'
  and t.season_id = s.id
  and tm.season_id = s.id
  and tm.team_id = t.id
  and tm.player_id = p.id
  and tm.ends_at is null
  and (
    (t.name = 'JFL QA Breakers' and p.display_name = 'JFL Mock Player 02')
    or (t.name = 'JFL QA Rail Riders' and p.display_name = 'JFL Mock Player 10')
    or (t.name = 'JFL QA Chalk Crew' and p.display_name = 'JFL Mock Player 14')
  );

-- Refuse to leave a half-normalized fixture behind.
do $$
declare
  league_count integer;
  completed_count integer;
  pending_count integer;
  pending_team_count integer;
  invalid_roster_count integer;
begin
  select count(*)
    into league_count
  from jfl.seasons
  where purpose = 'league';

  select count(*)
    into completed_count
  from jfl.seasons
  where purpose = 'league'
    and status = 'complete';

  select count(*)
    into pending_count
  from jfl.seasons
  where purpose = 'league'
    and status = 'registration';

  select count(*)
    into pending_team_count
  from jfl.teams t
  join jfl.seasons s on s.id = t.season_id
  where s.name = 'Upcoming Season';

  select count(*)
    into invalid_roster_count
  from (
    select t.id
    from jfl.teams t
    join jfl.seasons s
      on s.id = t.season_id
     and s.name = 'Upcoming Season'
    left join jfl.team_memberships tm
      on tm.team_id = t.id
     and tm.season_id = s.id
    group by t.id
    having count(tm.id) filter (where tm.ends_at is null) <> 4
       or count(tm.id) filter (
            where tm.ends_at is null
              and tm.role = 'captain'
          ) <> 1
  ) bad_rosters;

  if league_count <> 2
     or completed_count <> 1
     or pending_count <> 1 then
    raise exception
      'Expected exactly two league seasons: one complete and one registration (league %, complete %, registration %)',
      league_count, completed_count, pending_count;
  end if;

  if pending_team_count <> 8 then
    raise exception 'Expected 8 teams in Upcoming Season, found %', pending_team_count;
  end if;

  if invalid_roster_count <> 0 then
    raise exception 'Upcoming Season has % invalid rosters', invalid_roster_count;
  end if;
end $$;

commit;
