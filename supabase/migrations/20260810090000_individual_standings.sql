create or replace function public.list_individual_standings(
  target_season_id uuid
)
returns table (
  season_id uuid,
  player_id uuid,
  display_name text,
  standings_rank integer,
  prize_rank integer,
  matches_played integer,
  minimum_matches integer,
  is_prize_eligible boolean,
  wins integer,
  losses integer,
  win_percentage numeric,
  games_won integer,
  games_lost integer,
  game_differential integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with target_season as (
    select s.id as season_id, s.individual_min_matches
    from public.seasons s
    where s.id = target_season_id
  ),
  regular_player_results as (
    select
      pm.season_id,
      pm.player_a_id as player_id,
      case when pm.winner_side = 'A' then 1 else 0 end as wins,
      case when pm.winner_side = 'B' then 1 else 0 end as losses,
      pm.score_a as games_won,
      pm.score_b as games_lost
    from public.player_matches pm
    join public.rounds r
      on r.id = pm.round_id
     and r.season_id = pm.season_id
    where pm.season_id = target_season_id
      and r.stage = 'regular'
      and pm.status in ('finalized', 'corrected')
      and pm.winner_side in ('A', 'B')

    union all

    select
      pm.season_id,
      pm.player_b_id as player_id,
      case when pm.winner_side = 'B' then 1 else 0 end as wins,
      case when pm.winner_side = 'A' then 1 else 0 end as losses,
      pm.score_b as games_won,
      pm.score_a as games_lost
    from public.player_matches pm
    join public.rounds r
      on r.id = pm.round_id
     and r.season_id = pm.season_id
    where pm.season_id = target_season_id
      and r.stage = 'regular'
      and pm.status in ('finalized', 'corrected')
      and pm.winner_side in ('A', 'B')
  ),
  player_pool as (
    select ts.season_id, tm.player_id
    from target_season ts
    join public.team_memberships tm
      on tm.season_id = ts.season_id

    union

    select ts.season_id, sp.player_id
    from target_season ts
    join public.season_players sp
      on sp.season_id = ts.season_id

    union

    select rpr.season_id, rpr.player_id
    from regular_player_results rpr
  ),
  player_totals as (
    select
      pp.season_id,
      pp.player_id,
      coalesce(sum(rpr.wins + rpr.losses), 0)::integer as matches_played,
      coalesce(sum(rpr.wins), 0)::integer as wins,
      coalesce(sum(rpr.losses), 0)::integer as losses,
      coalesce(sum(rpr.games_won), 0)::integer as games_won,
      coalesce(sum(rpr.games_lost), 0)::integer as games_lost
    from player_pool pp
    left join regular_player_results rpr
      on rpr.season_id = pp.season_id
     and rpr.player_id = pp.player_id
    group by pp.season_id, pp.player_id
  ),
  standings as (
    select
      pt.season_id,
      pt.player_id,
      p.display_name,
      pt.matches_played,
      ts.individual_min_matches::integer as minimum_matches,
      (pt.matches_played >= ts.individual_min_matches) as is_prize_eligible,
      pt.wins,
      pt.losses,
      case
        when pt.matches_played = 0 then 0::numeric
        else round((pt.wins::numeric / pt.matches_played::numeric), 4)
      end as win_percentage,
      pt.games_won,
      pt.games_lost,
      (pt.games_won - pt.games_lost)::integer as game_differential
    from player_totals pt
    join target_season ts
      on ts.season_id = pt.season_id
    join public.players p
      on p.id = pt.player_id
  ),
  eligible_standings as (
    select
      standings.player_id,
      (dense_rank() over (
        order by standings.win_percentage desc, standings.wins desc
      ))::integer as prize_rank
    from standings
    where standings.is_prize_eligible
  )
  select
    standings.season_id,
    standings.player_id,
    standings.display_name,
    (dense_rank() over (
      order by standings.win_percentage desc, standings.wins desc
    ))::integer as standings_rank,
    eligible_standings.prize_rank,
    standings.matches_played,
    standings.minimum_matches,
    standings.is_prize_eligible,
    standings.wins,
    standings.losses,
    standings.win_percentage,
    standings.games_won,
    standings.games_lost,
    standings.game_differential
  from standings
  left join eligible_standings
    on eligible_standings.player_id = standings.player_id
  order by standings_rank, standings.is_prize_eligible desc, standings.display_name;
$$;

revoke all on function public.list_individual_standings(uuid)
  from public, anon, authenticated;
grant execute on function public.list_individual_standings(uuid)
  to service_role;

comment on function public.list_individual_standings(uuid) is
  'Service-role standings read model that derives individual records from completed regular-season player matches and season participation history.';
