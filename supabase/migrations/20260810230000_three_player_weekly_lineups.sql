do $$
begin
  if exists (
    select 1
    from private.team_lineup_slots
    where slot_number > 3
  ) then
    raise exception 'Cannot switch to three-player weekly lineups while legacy slot 4 lineup data exists';
  end if;
end;
$$;

alter table private.team_lineup_slots
  drop constraint if exists team_lineup_slots_slot_number_check;

alter table private.team_lineup_slots
  add constraint team_lineup_slots_slot_number_check
  check (slot_number between 1 and 3);

create or replace function public.submit_team_lineup(
  actor_user_id uuid,
  target_team_id uuid,
  target_round_id uuid,
  lineup_slots jsonb
)
returns table (
  lineup_id uuid,
  season_id uuid,
  round_id uuid,
  team_match_id uuid,
  team_id uuid,
  slot_number integer,
  player_id uuid,
  participation_type text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_round public.rounds%rowtype;
  target_match public.team_matches%rowtype;
  saved_lineup_id uuid;
  saved_submitted_at timestamptz;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_team_id is null then
    raise exception 'target_team_id is required';
  end if;

  if target_round_id is null then
    raise exception 'target_round_id is required';
  end if;

  if lineup_slots is null or jsonb_typeof(lineup_slots) is distinct from 'array' then
    raise exception 'lineup_slots must be an array';
  end if;

  if jsonb_array_length(lineup_slots) > 3 then
    raise exception 'Lineup cannot contain more than three slots';
  end if;

  select *
    into target_round
  from public.rounds r
  where r.id = target_round_id;

  if not found then
    raise exception 'Round not found';
  end if;

  if target_round.lineup_deadline_at is not null
     and now() > target_round.lineup_deadline_at then
    raise exception 'Lineup deadline has passed';
  end if;

  select *
    into target_match
  from public.team_matches tm
  where tm.round_id = target_round_id
    and (tm.team_a_id = target_team_id or tm.team_b_id = target_team_id)
  for update;

  if not found then
    raise exception 'Team is not scheduled for target round';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before submitting a lineup';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active captain can submit a lineup';
  end if;

  if exists (
    select 1
    from (
      select
        coalesce((slot_item.value ->> 'slotNumber')::integer, slot_item.ordinality::integer) as slot_number
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
    ) parsed_slots
    where parsed_slots.slot_number < 1
       or parsed_slots.slot_number > 3
  ) then
    raise exception 'Lineup slot numbers must be between 1 and 3';
  end if;

  if exists (
    select 1
    from (
      select
        coalesce((slot_item.value ->> 'slotNumber')::integer, slot_item.ordinality::integer) as slot_number
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
    ) parsed_slots
    group by parsed_slots.slot_number
    having count(*) > 1
  ) then
    raise exception 'Lineup slot numbers must be unique';
  end if;

  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    group by parsed_slots.player_id
    having count(*) > 1
  ) then
    raise exception 'Lineup players must be unique';
  end if;

  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    where not (
      exists (
        select 1
        from public.team_memberships tm
        where tm.team_id = target_team_id
          and tm.season_id = target_match.season_id
          and tm.player_id = parsed_slots.player_id
          and tm.ends_at is null
      )
      or exists (
        select 1
        from public.season_players sp
        join private.free_agent_availability fa
          on fa.season_id = sp.season_id
         and fa.player_id = sp.player_id
         and fa.round_id = target_round_id
        where sp.season_id = target_match.season_id
          and sp.player_id = parsed_slots.player_id
          and sp.participation_type = 'free_agent'
          and sp.status = 'active'
          and fa.status = 'available'
          and not exists (
            select 1
            from public.team_memberships active_tm
            where active_tm.season_id = target_match.season_id
              and active_tm.player_id = parsed_slots.player_id
              and active_tm.ends_at is null
          )
      )
    )
  ) then
    raise exception 'Lineup player is not eligible for this team round';
  end if;

  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    join private.team_lineup_slots tls
      on tls.round_id = target_round_id
     and tls.player_id = parsed_slots.player_id
    where tls.team_id <> target_team_id
  ) then
    raise exception 'Player is already scheduled for another team in this round';
  end if;

  insert into private.team_lineups (
    season_id,
    round_id,
    team_match_id,
    team_id,
    submitted_by
  ) values (
    target_match.season_id,
    target_round_id,
    target_match.id,
    target_team_id,
    actor_user_id
  )
  on conflict (team_match_id, team_id) do update
    set submitted_by = excluded.submitted_by,
        submitted_at = now(),
        updated_at = now()
  returning
    team_lineups.id,
    team_lineups.submitted_at
  into saved_lineup_id, saved_submitted_at;

  delete from private.team_lineup_slots tls
  where tls.lineup_id = saved_lineup_id;

  insert into private.team_lineup_slots (
    lineup_id,
    season_id,
    round_id,
    team_id,
    slot_number,
    player_id,
    participation_type
  )
  select
    saved_lineup_id,
    target_match.season_id,
    target_round_id,
    target_team_id,
    slot_numbers.slot_number,
    parsed_slots.player_id,
    case
      when parsed_slots.player_id is null then 'forfeit'
      when exists (
        select 1
        from public.team_memberships tm
        where tm.team_id = target_team_id
          and tm.season_id = target_match.season_id
          and tm.player_id = parsed_slots.player_id
          and tm.ends_at is null
      ) then 'roster'
      else 'free_agent'
    end
  from generate_series(1, 3) as slot_numbers(slot_number)
  left join (
    select
      coalesce((slot_item.value ->> 'slotNumber')::integer, slot_item.ordinality::integer) as slot_number,
      nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
    from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
  ) parsed_slots
    on parsed_slots.slot_number = slot_numbers.slot_number
  order by slot_numbers.slot_number;

  return query
  select
    tl.id as lineup_id,
    tl.season_id,
    tl.round_id,
    tl.team_match_id,
    tl.team_id,
    tls.slot_number,
    tls.player_id,
    tls.participation_type,
    tl.submitted_at
  from private.team_lineups tl
  join private.team_lineup_slots tls
    on tls.lineup_id = tl.id
  where tl.id = saved_lineup_id
  order by tls.slot_number;
end;
$$;

revoke all on function public.submit_team_lineup(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_team_lineup(uuid, uuid, uuid, jsonb)
  to service_role;

create or replace function private.rebuild_generated_team_match_results(
  target_team_match_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.team_matches%rowtype;
  team_a_lineup_id uuid;
  team_b_lineup_id uuid;
  team_a_slot_count integer;
  team_b_slot_count integer;
  submitted_lineup_count integer;
begin
  select *
    into target_match
  from public.team_matches tm
  where tm.id = target_team_match_id;

  if not found then
    return;
  end if;

  delete from public.player_matches pm
  where pm.team_match_id = target_team_match_id;

  delete from public.team_match_forfeits tmf
  where tmf.team_match_id = target_team_match_id;

  select count(*)::integer
    into submitted_lineup_count
  from private.team_lineups tl
  where tl.team_match_id = target_team_match_id;

  select tl.id
    into team_a_lineup_id
  from private.team_lineups tl
  where tl.team_match_id = target_team_match_id
    and tl.team_id = target_match.team_a_id;

  select tl.id
    into team_b_lineup_id
  from private.team_lineups tl
  where tl.team_match_id = target_team_match_id
    and tl.team_id = target_match.team_b_id;

  if team_a_lineup_id is null or team_b_lineup_id is null then
    if submitted_lineup_count > 0 and target_match.status = 'scheduled' then
      update public.team_matches
      set status = 'lineups_due'
      where team_matches.id = target_team_match_id;
    end if;

    return;
  end if;

  select count(*)::integer
    into team_a_slot_count
  from private.team_lineup_slots tls
  where tls.lineup_id = team_a_lineup_id;

  select count(*)::integer
    into team_b_slot_count
  from private.team_lineup_slots tls
  where tls.lineup_id = team_b_lineup_id;

  if team_a_slot_count <> 3 or team_b_slot_count <> 3 then
    return;
  end if;

  insert into public.player_matches (
    season_id,
    round_id,
    team_match_id,
    slot_number,
    team_a_id,
    team_b_id,
    player_a_id,
    player_b_id
  )
  select
    target_match.season_id,
    target_match.round_id,
    target_match.id,
    a_slots.slot_number,
    target_match.team_a_id,
    target_match.team_b_id,
    a_slots.player_id,
    b_slots.player_id
  from private.team_lineup_slots a_slots
  join private.team_lineup_slots b_slots
    on b_slots.lineup_id = team_b_lineup_id
   and b_slots.slot_number = a_slots.slot_number
  where a_slots.lineup_id = team_a_lineup_id
    and a_slots.player_id is not null
    and b_slots.player_id is not null
  order by a_slots.slot_number;

  insert into public.team_match_forfeits (
    season_id,
    round_id,
    team_match_id,
    slot_number,
    forfeiting_team_id,
    credited_team_id
  )
  select
    target_match.season_id,
    target_match.round_id,
    target_match.id,
    a_slots.slot_number,
    target_match.team_a_id,
    case when b_slots.player_id is not null then target_match.team_b_id else null end
  from private.team_lineup_slots a_slots
  join private.team_lineup_slots b_slots
    on b_slots.lineup_id = team_b_lineup_id
   and b_slots.slot_number = a_slots.slot_number
  where a_slots.lineup_id = team_a_lineup_id
    and a_slots.player_id is null
  order by a_slots.slot_number;

  insert into public.team_match_forfeits (
    season_id,
    round_id,
    team_match_id,
    slot_number,
    forfeiting_team_id,
    credited_team_id
  )
  select
    target_match.season_id,
    target_match.round_id,
    target_match.id,
    b_slots.slot_number,
    target_match.team_b_id,
    case when a_slots.player_id is not null then target_match.team_a_id else null end
  from private.team_lineup_slots b_slots
  join private.team_lineup_slots a_slots
    on a_slots.lineup_id = team_a_lineup_id
   and a_slots.slot_number = b_slots.slot_number
  where b_slots.lineup_id = team_b_lineup_id
    and b_slots.player_id is null
  order by b_slots.slot_number;

  update public.team_matches
  set status = 'in_progress'
  where team_matches.id = target_team_match_id
    and team_matches.status in ('scheduled', 'lineups_due');
end;
$$;

revoke all on function private.rebuild_generated_team_match_results(uuid)
  from public;

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
    having count(distinct sr.slot_number) = 3
      and not exists (
        select 1
        from public.team_match_forfeits unresolved
        where unresolved.team_match_id = rtm.id
          and unresolved.credited_team_id is null
      )
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
      0::integer as team_draws
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
      0::integer as team_draws,
      coalesce(sum(tmr.team_wins * 2), 0)::integer as standing_points,
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
      0::integer as team_draws,
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

comment on table private.team_lineup_slots is
  'Private three-slot weekly lineup entries. Blank slots are explicit forfeits and never create fake individual player records.';

comment on function public.submit_team_lineup(uuid, uuid, uuid, jsonb) is
  'Service-role-only captain boundary for submitting up to three roster or eligible free-agent weekly lineup slots.';

comment on function private.rebuild_generated_team_match_results(uuid) is
  'Rebuilds generated player matches and forfeits for a team match once both three-slot weekly lineups exist.';

comment on function public.list_team_standings(uuid) is
  'Service-role standings read model for three-player regular-season team matches. Regular-season draws are not valid results.';
