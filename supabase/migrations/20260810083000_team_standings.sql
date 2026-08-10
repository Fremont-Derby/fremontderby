create or replace function public.list_team_standings(
  target_season_id uuid
)
returns table (
  season_id uuid,
  team_id uuid,
  team_name text,
  standings_rank integer,
  games_played integer,
  maximum_matches integer,
  standing_points integer,
  team_wins integer,
  team_losses integer,
  team_draws integer,
  match_points integer,
  match_points_against integer,
  point_differential integer,
  player_match_wins integer,
  player_match_losses integer,
  forfeits_won integer,
  forfeits_lost integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with season_teams as (
    select t.season_id, t.id as team_id, t.name as team_name
    from public.teams t
    where t.season_id = target_season_id
  ),
  regular_team_matches as (
    select tm.*
    from public.team_matches tm
    join public.rounds r
      on r.id = tm.round_id
     and r.season_id = tm.season_id
    where tm.season_id = target_season_id
      and r.stage = 'regular'
  ),
  team_schedule as (
    select scheduled.team_id, count(*)::integer as maximum_matches
    from (
      select rtm.team_a_id as team_id
      from regular_team_matches rtm
      union all
      select rtm.team_b_id as team_id
      from regular_team_matches rtm
    ) scheduled
    group by scheduled.team_id
  ),
  slot_results as (
    select pm.team_match_id, pm.slot_number
    from public.player_matches pm
    join regular_team_matches rtm
      on rtm.id = pm.team_match_id
    where pm.status in ('finalized', 'corrected')
      and pm.winner_side in ('A', 'B')

    union

    select tmf.team_match_id, tmf.slot_number
    from public.team_match_forfeits tmf
    join regular_team_matches rtm
      on rtm.id = tmf.team_match_id
  ),
  complete_team_matches as (
    select rtm.*
    from regular_team_matches rtm
    join slot_results sr
      on sr.team_match_id = rtm.id
    group by rtm.id, rtm.season_id, rtm.round_id, rtm.table_number, rtm.team_a_id, rtm.team_b_id,
      rtm.status, rtm.winner_team_id, rtm.created_at
    having count(distinct sr.slot_number) = 4
  ),
  team_match_sides as (
    select
      ctm.id as team_match_id,
      ctm.season_id,
      ctm.team_a_id as team_id,
      ctm.team_b_id as opponent_team_id
    from complete_team_matches ctm

    union all

    select
      ctm.id as team_match_id,
      ctm.season_id,
      ctm.team_b_id as team_id,
      ctm.team_a_id as opponent_team_id
    from complete_team_matches ctm
  ),
  slot_points as (
    select
      pm.team_match_id,
      pm.team_a_id as team_id,
      case when pm.winner_side = 'A' then 1 else 0 end as match_points,
      case when pm.winner_side = 'A' then 1 else 0 end as player_match_wins,
      case when pm.winner_side = 'B' then 1 else 0 end as player_match_losses,
      0 as forfeits_won,
      0 as forfeits_lost
    from public.player_matches pm
    join complete_team_matches ctm
      on ctm.id = pm.team_match_id
    where pm.status in ('finalized', 'corrected')
      and pm.winner_side in ('A', 'B')

    union all

    select
      pm.team_match_id,
      pm.team_b_id as team_id,
      case when pm.winner_side = 'B' then 1 else 0 end as match_points,
      case when pm.winner_side = 'B' then 1 else 0 end as player_match_wins,
      case when pm.winner_side = 'A' then 1 else 0 end as player_match_losses,
      0 as forfeits_won,
      0 as forfeits_lost
    from public.player_matches pm
    join complete_team_matches ctm
      on ctm.id = pm.team_match_id
    where pm.status in ('finalized', 'corrected')
      and pm.winner_side in ('A', 'B')

    union all

    select
      tmf.team_match_id,
      tmf.credited_team_id as team_id,
      1 as match_points,
      0 as player_match_wins,
      0 as player_match_losses,
      1 as forfeits_won,
      0 as forfeits_lost
    from public.team_match_forfeits tmf
    join complete_team_matches ctm
      on ctm.id = tmf.team_match_id
    where tmf.credited_team_id is not null

    union all

    select
      tmf.team_match_id,
      tmf.forfeiting_team_id as team_id,
      0 as match_points,
      0 as player_match_wins,
      0 as player_match_losses,
      0 as forfeits_won,
      1 as forfeits_lost
    from public.team_match_forfeits tmf
    join complete_team_matches ctm
      on ctm.id = tmf.team_match_id
  ),
  team_match_points as (
    select
      sp.team_match_id,
      sp.team_id,
      coalesce(sum(sp.match_points), 0)::integer as match_points,
      coalesce(sum(sp.player_match_wins), 0)::integer as player_match_wins,
      coalesce(sum(sp.player_match_losses), 0)::integer as player_match_losses,
      coalesce(sum(sp.forfeits_won), 0)::integer as forfeits_won,
      coalesce(sum(sp.forfeits_lost), 0)::integer as forfeits_lost
    from slot_points sp
    group by sp.team_match_id, sp.team_id
  ),
  team_match_results as (
    select
      sides.season_id,
      sides.team_match_id,
      sides.team_id,
      coalesce(own.match_points, 0)::integer as match_points,
      coalesce(opponent.match_points, 0)::integer as match_points_against,
      coalesce(own.player_match_wins, 0)::integer as player_match_wins,
      coalesce(own.player_match_losses, 0)::integer as player_match_losses,
      coalesce(own.forfeits_won, 0)::integer as forfeits_won,
      coalesce(own.forfeits_lost, 0)::integer as forfeits_lost,
      case
        when coalesce(own.match_points, 0) > coalesce(opponent.match_points, 0) then 1
        else 0
      end as team_wins,
      case
        when coalesce(own.match_points, 0) < coalesce(opponent.match_points, 0) then 1
        else 0
      end as team_losses,
      case
        when coalesce(own.match_points, 0) = coalesce(opponent.match_points, 0) then 1
        else 0
      end as team_draws
    from team_match_sides sides
    left join team_match_points own
      on own.team_match_id = sides.team_match_id
     and own.team_id = sides.team_id
    left join team_match_points opponent
      on opponent.team_match_id = sides.team_match_id
     and opponent.team_id = sides.opponent_team_id
  ),
  team_totals as (
    select
      tmr.season_id,
      tmr.team_id,
      count(*)::integer as games_played,
      coalesce(sum(tmr.team_wins), 0)::integer as team_wins,
      coalesce(sum(tmr.team_losses), 0)::integer as team_losses,
      coalesce(sum(tmr.team_draws), 0)::integer as team_draws,
      coalesce(sum(tmr.team_wins * 2 + tmr.team_draws), 0)::integer as standing_points,
      coalesce(sum(tmr.match_points), 0)::integer as match_points,
      coalesce(sum(tmr.match_points_against), 0)::integer as match_points_against,
      coalesce(sum(tmr.player_match_wins), 0)::integer as player_match_wins,
      coalesce(sum(tmr.player_match_losses), 0)::integer as player_match_losses,
      coalesce(sum(tmr.forfeits_won), 0)::integer as forfeits_won,
      coalesce(sum(tmr.forfeits_lost), 0)::integer as forfeits_lost
    from team_match_results tmr
    group by tmr.season_id, tmr.team_id
  ),
  standings as (
    select
      st.season_id,
      st.team_id,
      st.team_name,
      coalesce(tt.games_played, 0)::integer as games_played,
      coalesce(ts.maximum_matches, 0)::integer as maximum_matches,
      coalesce(tt.standing_points, 0)::integer as standing_points,
      coalesce(tt.team_wins, 0)::integer as team_wins,
      coalesce(tt.team_losses, 0)::integer as team_losses,
      coalesce(tt.team_draws, 0)::integer as team_draws,
      coalesce(tt.match_points, 0)::integer as match_points,
      coalesce(tt.match_points_against, 0)::integer as match_points_against,
      (coalesce(tt.match_points, 0) - coalesce(tt.match_points_against, 0))::integer as point_differential,
      coalesce(tt.player_match_wins, 0)::integer as player_match_wins,
      coalesce(tt.player_match_losses, 0)::integer as player_match_losses,
      coalesce(tt.forfeits_won, 0)::integer as forfeits_won,
      coalesce(tt.forfeits_lost, 0)::integer as forfeits_lost
    from season_teams st
    left join team_totals tt
      on tt.team_id = st.team_id
    left join team_schedule ts
      on ts.team_id = st.team_id
  )
  select
    standings.season_id,
    standings.team_id,
    standings.team_name,
    dense_rank() over (
      order by
        standings.standing_points desc,
        standings.match_points desc,
        standings.point_differential desc
    )::integer as standings_rank,
    standings.games_played,
    standings.maximum_matches,
    standings.standing_points,
    standings.team_wins,
    standings.team_losses,
    standings.team_draws,
    standings.match_points,
    standings.match_points_against,
    standings.point_differential,
    standings.player_match_wins,
    standings.player_match_losses,
    standings.forfeits_won,
    standings.forfeits_lost
  from standings
  order by standings_rank, standings.team_name;
$$;

revoke all on function public.list_team_standings(uuid)
  from public, anon, authenticated;
grant execute on function public.list_team_standings(uuid)
  to service_role;

comment on function public.list_team_standings(uuid) is
  'Service-role standings read model that derives team records from completed regular-season matches, finalized player matches, and lineup forfeits.';
