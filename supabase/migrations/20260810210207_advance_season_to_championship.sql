create or replace function public.advance_season_to_championship(
  target_season_id uuid,
  actor_user_id uuid
)
returns table(
  round_id uuid,
  championship_match_id uuid,
  championship_team_a_id uuid,
  championship_team_b_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_round_id uuid;
  semifinal_round_id uuid;
  created_round_id uuid;
  created_match_id uuid;
  semifinal_match_count integer;
  completed_semifinal_count integer;
  tied_semifinal_count integer;
  winner_team_ids uuid[];
begin
  if not exists (
    select 1
    from private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  if not exists (
    select 1 from public.seasons s where s.id = target_season_id
  ) then
    raise exception 'Season not found';
  end if;

  perform 1
  from public.seasons s
  where s.id = target_season_id
  for update;

  select r.id
  into existing_round_id
  from public.rounds r
  where r.season_id = target_season_id
    and r.stage = 'championship'
  order by r.round_number
  limit 1;

  if existing_round_id is not null then
    return query
      select existing_round_id,
             tm.id,
             tm.team_a_id,
             tm.team_b_id
      from public.team_matches tm
      where tm.round_id = existing_round_id
      order by tm.table_number
      limit 1;
    return;
  end if;

  select r.id
  into semifinal_round_id
  from public.rounds r
  where r.season_id = target_season_id
    and r.stage = 'semifinal'
  order by r.round_number
  limit 1;

  if semifinal_round_id is null then
    raise exception 'Semifinals must be started before the championship';
  end if;

  select count(*)::integer
  into semifinal_match_count
  from public.team_matches tm
  where tm.round_id = semifinal_round_id;

  if semifinal_match_count <> 2 then
    raise exception 'Exactly two semifinal team matchups are required';
  end if;

  with result_slots as (
    select
      pm.team_match_id,
      pm.slot_number,
      case
        when pm.winner_side = 'A' then pm.team_a_id
        when pm.winner_side = 'B' then pm.team_b_id
        else null
      end as credited_team_id
    from public.player_matches pm
    where pm.round_id = semifinal_round_id
      and pm.status in ('finalized', 'corrected')
      and pm.winner_side in ('A', 'B')

    union

    select
      tmf.team_match_id,
      tmf.slot_number,
      tmf.credited_team_id
    from public.team_match_forfeits tmf
    where tmf.round_id = semifinal_round_id
  ),
  semifinal_scores as (
    select
      tm.id as team_match_id,
      tm.table_number,
      tm.team_a_id,
      tm.team_b_id,
      count(distinct rs.slot_number)::integer as completed_slots,
      count(*) filter (where rs.credited_team_id = tm.team_a_id)::integer as score_a,
      count(*) filter (where rs.credited_team_id = tm.team_b_id)::integer as score_b
    from public.team_matches tm
    left join result_slots rs on rs.team_match_id = tm.id
    where tm.round_id = semifinal_round_id
    group by tm.id, tm.table_number, tm.team_a_id, tm.team_b_id
  )
  select
    count(*) filter (where ss.completed_slots = 4)::integer,
    count(*) filter (
      where ss.completed_slots = 4
        and ss.score_a = ss.score_b
    )::integer,
    array_agg(
      case
        when ss.completed_slots <> 4 then null
        when ss.score_a > ss.score_b then ss.team_a_id
        when ss.score_b > ss.score_a then ss.team_b_id
        else null
      end
      order by ss.table_number
    )
  into completed_semifinal_count, tied_semifinal_count, winner_team_ids
  from semifinal_scores ss;

  if completed_semifinal_count <> 2 then
    raise exception 'Both semifinals must have four resolved slots before the championship';
  end if;

  if tied_semifinal_count > 0 then
    raise exception 'Semifinal team score is tied; resolve the semifinal before the championship';
  end if;

  if coalesce(array_length(winner_team_ids, 1), 0) <> 2
     or winner_team_ids[1] is null
     or winner_team_ids[2] is null
     or winner_team_ids[1] = winner_team_ids[2] then
    raise exception 'Two distinct semifinal winners are required';
  end if;

  with result_slots as (
    select
      pm.team_match_id,
      pm.slot_number,
      case
        when pm.winner_side = 'A' then pm.team_a_id
        when pm.winner_side = 'B' then pm.team_b_id
        else null
      end as credited_team_id
    from public.player_matches pm
    where pm.round_id = semifinal_round_id
      and pm.status in ('finalized', 'corrected')
      and pm.winner_side in ('A', 'B')

    union

    select
      tmf.team_match_id,
      tmf.slot_number,
      tmf.credited_team_id
    from public.team_match_forfeits tmf
    where tmf.round_id = semifinal_round_id
  ),
  semifinal_scores as (
    select
      tm.id as team_match_id,
      tm.team_a_id,
      tm.team_b_id,
      count(*) filter (where rs.credited_team_id = tm.team_a_id)::integer as score_a,
      count(*) filter (where rs.credited_team_id = tm.team_b_id)::integer as score_b
    from public.team_matches tm
    left join result_slots rs on rs.team_match_id = tm.id
    where tm.round_id = semifinal_round_id
    group by tm.id, tm.team_a_id, tm.team_b_id
  )
  update public.team_matches tm
  set status = 'finalized',
      winner_team_id = case
        when ss.score_a > ss.score_b then ss.team_a_id
        else ss.team_b_id
      end
  from semifinal_scores ss
  where tm.id = ss.team_match_id;

  update public.rounds
  set status = 'finalized'
  where id = semifinal_round_id;

  insert into public.rounds (
    season_id,
    round_number,
    stage,
    status
  ) values (
    target_season_id,
    9,
    'championship',
    'scheduled'
  )
  returning id into created_round_id;

  insert into public.team_matches (
    season_id,
    round_id,
    table_number,
    team_a_id,
    team_b_id,
    status
  ) values (
    target_season_id,
    created_round_id,
    1,
    winner_team_ids[1],
    winner_team_ids[2],
    'scheduled'
  )
  returning id into created_match_id;

  return query
    select created_round_id, created_match_id, winner_team_ids[1], winner_team_ids[2];
end;
$$;

revoke all on function public.advance_season_to_championship(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.advance_season_to_championship(uuid, uuid)
to service_role;

comment on function public.advance_season_to_championship(uuid, uuid) is
  'Trusted idempotent Season 1 transition that derives two completed semifinal winners and persists the championship matchup.';
