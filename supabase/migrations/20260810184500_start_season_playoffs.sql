create or replace function public.start_season_playoffs(
  target_season_id uuid,
  actor_user_id uuid
)
returns table(round_id uuid, semifinal_one_id uuid, semifinal_two_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_round_id uuid;
  seed_team_ids uuid[];
  created_round_id uuid;
  first_match_id uuid;
  second_match_id uuid;
  regular_round_count integer;
  team_count integer;
  completed_team_count integer;
begin
  if not exists (
    select 1
    from private.league_admins la
    where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  select r.id
  into existing_round_id
  from public.rounds r
  where r.season_id = target_season_id
    and r.stage = 'semifinal'
  order by r.round_number
  limit 1;

  if existing_round_id is not null then
    return query
      select existing_round_id,
             (select tm.id
              from public.team_matches tm
              where tm.round_id = existing_round_id
              order by tm.table_number
              limit 1),
             (select tm.id
              from public.team_matches tm
              where tm.round_id = existing_round_id
              order by tm.table_number
              offset 1
              limit 1);
    return;
  end if;

  if not exists (
    select 1 from public.seasons s where s.id = target_season_id
  ) then
    raise exception 'Season not found';
  end if;

  select count(*)::integer
  into regular_round_count
  from public.rounds r
  where r.season_id = target_season_id
    and r.stage = 'regular';

  if regular_round_count <> 7 then
    raise exception 'Season must have exactly seven regular rounds before playoffs';
  end if;

  select count(*)::integer
  into team_count
  from public.teams t
  where t.season_id = target_season_id;

  if team_count <> 8 then
    raise exception 'Season must have exactly eight teams before playoffs';
  end if;

  select count(*)::integer
  into completed_team_count
  from public.list_team_standings(target_season_id) standings
  where standings.games_played = 7
    and standings.maximum_matches = 7;

  if completed_team_count <> 8 then
    raise exception 'All seven regular-season matchups must be complete before playoffs';
  end if;

  select array_agg(seeded.team_id order by seeded.seed_position)
  into seed_team_ids
  from (
    select standings.team_id,
           row_number() over (
             order by standings.standings_rank,
                      standings.standing_points desc,
                      standings.match_points desc,
                      standings.point_differential desc,
                      standings.team_name
           )::integer as seed_position
    from public.list_team_standings(target_season_id) standings
    order by standings.standings_rank,
             standings.standing_points desc,
             standings.match_points desc,
             standings.point_differential desc,
             standings.team_name
    limit 4
  ) seeded;

  if coalesce(array_length(seed_team_ids, 1), 0) <> 4 then
    raise exception 'Four playoff seeds are required';
  end if;

  insert into public.rounds (
    season_id,
    round_number,
    stage,
    status
  ) values (
    target_season_id,
    8,
    'semifinal',
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
    seed_team_ids[1],
    seed_team_ids[4],
    'scheduled'
  )
  returning id into first_match_id;

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
    2,
    seed_team_ids[2],
    seed_team_ids[3],
    'scheduled'
  )
  returning id into second_match_id;

  update public.seasons
  set status = 'playoffs',
      updated_at = now()
  where id = target_season_id;

  return query
    select created_round_id, first_match_id, second_match_id;
end;
$$;

revoke all on function public.start_season_playoffs(uuid, uuid)
from public, anon, authenticated;

grant execute on function public.start_season_playoffs(uuid, uuid)
to service_role;

comment on function public.start_season_playoffs(uuid, uuid) is
  'Trusted idempotent Season 1 transition that seeds #1 vs #4 and #2 vs #3 after all seven regular-season matchups are complete.';
