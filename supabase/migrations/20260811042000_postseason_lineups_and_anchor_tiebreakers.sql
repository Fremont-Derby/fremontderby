alter table private.team_lineup_slots
  drop constraint if exists team_lineup_slots_slot_number_check;

alter table private.team_lineup_slots
  add constraint team_lineup_slots_slot_number_check
  check (slot_number between 1 and 4);

alter table private.team_lineups
  add column if not exists anchor_player_id uuid references public.players(id) on delete restrict;

create table if not exists private.postseason_anchor_tiebreakers (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  parent_round_id uuid not null,
  parent_team_match_id uuid not null unique references public.team_matches(id) on delete cascade,
  tiebreaker_round_id uuid not null unique,
  tiebreaker_team_match_id uuid not null unique references public.team_matches(id) on delete cascade,
  anchor_player_match_id uuid not null unique references public.player_matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (parent_round_id, season_id) references public.rounds(id, season_id) on delete cascade,
  foreign key (tiebreaker_round_id, season_id) references public.rounds(id, season_id) on delete cascade
);

alter table private.postseason_anchor_tiebreakers enable row level security;
revoke all on private.postseason_anchor_tiebreakers from public, anon, authenticated;
grant select, insert, update, delete on private.postseason_anchor_tiebreakers to service_role;

create or replace function private.rebuild_generated_team_match_results(target_team_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.team_matches%rowtype;
  target_round public.rounds%rowtype;
  team_a_lineup_id uuid;
  team_b_lineup_id uuid;
  team_a_slot_count integer;
  team_b_slot_count integer;
  submitted_lineup_count integer;
  expected_slots integer;
begin
  select * into target_match
  from public.team_matches tm
  where tm.id = target_team_match_id;

  if not found then return; end if;

  select * into target_round
  from public.rounds r
  where r.id = target_match.round_id;

  if target_round.stage = 'tiebreaker' then return; end if;
  expected_slots := case when target_round.stage = 'regular' then 3 else 4 end;

  delete from public.player_matches pm where pm.team_match_id = target_team_match_id;
  delete from public.team_match_forfeits tmf where tmf.team_match_id = target_team_match_id;

  select count(*)::integer into submitted_lineup_count
  from private.team_lineups tl where tl.team_match_id = target_team_match_id;

  select tl.id into team_a_lineup_id
  from private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_a_id;

  select tl.id into team_b_lineup_id
  from private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_b_id;

  if team_a_lineup_id is null or team_b_lineup_id is null then
    if submitted_lineup_count > 0 and target_match.status = 'scheduled' then
      update public.team_matches set status = 'lineups_due' where id = target_team_match_id;
    end if;
    return;
  end if;

  select count(*)::integer into team_a_slot_count
  from private.team_lineup_slots tls where tls.lineup_id = team_a_lineup_id;
  select count(*)::integer into team_b_slot_count
  from private.team_lineup_slots tls where tls.lineup_id = team_b_lineup_id;

  if team_a_slot_count <> expected_slots or team_b_slot_count <> expected_slots then return; end if;

  insert into public.player_matches (
    season_id, round_id, team_match_id, slot_number,
    team_a_id, team_b_id, player_a_id, player_b_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id, target_match.team_b_id,
         a.player_id, b.player_id
  from private.team_lineup_slots a
  join private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id
    and a.player_id is not null and b.player_id is not null
  order by a.slot_number;

  insert into public.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id,
         case when b.player_id is not null then target_match.team_b_id else null end
  from private.team_lineup_slots a
  join private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id and a.player_id is null;

  insert into public.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         b.slot_number, target_match.team_b_id,
         case when a.player_id is not null then target_match.team_a_id else null end
  from private.team_lineup_slots b
  join private.team_lineup_slots a
    on a.lineup_id = team_a_lineup_id and a.slot_number = b.slot_number
  where b.lineup_id = team_b_lineup_id and b.player_id is null;

  update public.team_matches
  set status = 'in_progress'
  where id = target_team_match_id and status in ('scheduled', 'lineups_due');
end;
$$;

create or replace function public.submit_postseason_lineup(
  actor_user_id uuid,
  target_team_match_id uuid,
  target_team_id uuid,
  lineup_player_ids uuid[],
  anchor_player_id uuid
)
returns table(
  lineup_id uuid,
  team_match_id uuid,
  team_id uuid,
  slot_number integer,
  player_id uuid,
  locked_anchor_player_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_match public.team_matches%rowtype;
  target_round public.rounds%rowtype;
  saved_lineup_id uuid;
  qualifying_four_count integer;
  qualifying_three_count integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_match_id is null then raise exception 'target_team_match_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if coalesce(array_length(lineup_player_ids, 1), 0) <> 4 then
    raise exception 'Postseason lineup requires exactly four players';
  end if;
  if anchor_player_id is null then raise exception 'Postseason anchor is required'; end if;

  select * into target_match
  from public.team_matches tm
  where tm.id = target_team_match_id
  for update;
  if not found then raise exception 'Team matchup not found'; end if;

  select * into target_round from public.rounds r where r.id = target_match.round_id;
  if target_round.stage not in ('semifinal', 'championship') then
    raise exception 'Postseason lineup is only valid for a semifinal or championship';
  end if;
  if target_team_id not in (target_match.team_a_id, target_match.team_b_id) then
    raise exception 'Team is not part of this postseason matchup';
  end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if actor_player_id is null then raise exception 'Player profile is required'; end if;
  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id and tm.player_id = actor_player_id
      and tm.role = 'captain' and tm.ends_at is null
  ) then raise exception 'Only the active captain can submit a postseason lineup'; end if;

  if exists (
    select 1 from private.team_lineups tl
    where tl.team_match_id = target_team_match_id and tl.team_id = target_team_id
  ) then raise exception 'Postseason lineup and anchor are locked after submission'; end if;

  if (select count(distinct p) from unnest(lineup_player_ids) p) <> 4 then
    raise exception 'Postseason lineup players must be unique';
  end if;
  if not (anchor_player_id = any(lineup_player_ids)) then
    raise exception 'Postseason anchor must be selected from the submitted lineup';
  end if;

  if exists (
    select 1 from unnest(lineup_player_ids) pid
    where not exists (
      select 1 from public.team_memberships tm
      where tm.season_id = target_match.season_id and tm.team_id = target_team_id
        and tm.player_id = pid and tm.ends_at is null
    )
  ) then raise exception 'Every postseason player must be an active member of the team'; end if;

  with player_counts as (
    select pid.player_id,
      (
        select count(*)::integer
        from public.player_matches pm
        join public.rounds r on r.id = pm.round_id
        where pm.season_id = target_match.season_id
          and r.stage = 'regular'
          and pm.status in ('finalized', 'corrected')
          and (
            (pm.team_a_id = target_team_id and pm.player_a_id = pid.player_id)
            or (pm.team_b_id = target_team_id and pm.player_b_id = pid.player_id)
          )
      ) as team_matches_played
    from unnest(lineup_player_ids) as pid(player_id)
  )
  select count(*) filter (where team_matches_played >= 4)::integer,
         count(*) filter (where team_matches_played >= 3)::integer
  into qualifying_four_count, qualifying_three_count
  from player_counts;

  if qualifying_four_count < 3 or qualifying_three_count < 4 then
    raise exception 'Postseason lineup requires three players with 4+ team matches and a fourth with 3+';
  end if;

  insert into private.team_lineups (
    season_id, round_id, team_match_id, team_id, submitted_by, anchor_player_id
  ) values (
    target_match.season_id, target_match.round_id, target_team_match_id,
    target_team_id, actor_user_id, anchor_player_id
  ) returning id into saved_lineup_id;

  insert into private.team_lineup_slots (
    lineup_id, season_id, round_id, team_id, slot_number, player_id, participation_type
  )
  select saved_lineup_id, target_match.season_id, target_match.round_id,
         target_team_id, ordinality::integer, player_id, 'roster'
  from unnest(lineup_player_ids) with ordinality as lineup(player_id, ordinality);

  return query
  select tl.id, tl.team_match_id, tl.team_id, tls.slot_number, tls.player_id, tl.anchor_player_id
  from private.team_lineups tl
  join private.team_lineup_slots tls on tls.lineup_id = tl.id
  where tl.id = saved_lineup_id
  order by tls.slot_number;
end;
$$;

revoke all on function public.submit_postseason_lineup(uuid, uuid, uuid, uuid[], uuid)
from public, anon, authenticated;
grant execute on function public.submit_postseason_lineup(uuid, uuid, uuid, uuid[], uuid)
to service_role;

create or replace function private.refresh_postseason_team_match(target_team_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  tm public.team_matches%rowtype;
  rd public.rounds%rowtype;
  link private.postseason_anchor_tiebreakers%rowtype;
  resolved_slots integer;
  score_a integer;
  score_b integer;
  anchor_a uuid;
  anchor_b uuid;
  tb_round_id uuid;
  tb_team_match_id uuid;
  tb_player_match_id uuid;
  next_tb_round integer;
  anchor_match public.player_matches%rowtype;
begin
  select * into tm from public.team_matches where id = target_team_match_id;
  if not found then return; end if;
  select * into rd from public.rounds where id = tm.round_id;

  if rd.stage = 'tiebreaker' then
    select * into link
    from private.postseason_anchor_tiebreakers pat
    where pat.tiebreaker_team_match_id = tm.id;
    if not found then return; end if;

    select * into anchor_match
    from public.player_matches pm
    where pm.id = link.anchor_player_match_id;
    if anchor_match.status not in ('finalized', 'corrected') or anchor_match.winner_side is null then return; end if;

    update public.team_matches
    set status = 'finalized',
        winner_team_id = case when anchor_match.winner_side = 'A' then anchor_match.team_a_id else anchor_match.team_b_id end
    where id = tm.id;
    update public.rounds set status = 'finalized' where id = tm.round_id;
    update public.team_matches
    set status = 'finalized',
        winner_team_id = case when anchor_match.winner_side = 'A' then anchor_match.team_a_id else anchor_match.team_b_id end
    where id = link.parent_team_match_id;

    update public.rounds r
    set status = 'finalized'
    where r.id = link.parent_round_id
      and not exists (
        select 1 from public.team_matches sibling
        where sibling.round_id = r.id and sibling.status <> 'finalized'
      );

    if exists (select 1 from public.rounds pr where pr.id = link.parent_round_id and pr.stage = 'championship') then
      update public.seasons set status = 'complete' where id = link.season_id;
    end if;
    return;
  end if;

  if rd.stage not in ('semifinal', 'championship') then return; end if;

  select count(*)::integer,
         count(*) filter (where pm.winner_side = 'A')::integer,
         count(*) filter (where pm.winner_side = 'B')::integer
  into resolved_slots, score_a, score_b
  from public.player_matches pm
  where pm.team_match_id = tm.id
    and pm.slot_number between 1 and 4
    and pm.status in ('finalized', 'corrected')
    and pm.winner_side in ('A', 'B');

  if resolved_slots <> 4 then return; end if;

  if score_a <> score_b then
    update public.team_matches
    set status = 'finalized', winner_team_id = case when score_a > score_b then team_a_id else team_b_id end
    where id = tm.id;

    update public.rounds r
    set status = 'finalized'
    where r.id = tm.round_id
      and not exists (
        select 1 from public.team_matches sibling
        where sibling.round_id = r.id and sibling.status <> 'finalized'
      );

    if rd.stage = 'championship' then
      update public.seasons set status = 'complete' where id = tm.season_id;
    end if;
    return;
  end if;

  if exists (
    select 1 from private.postseason_anchor_tiebreakers pat
    where pat.parent_team_match_id = tm.id
  ) then return; end if;

  select tl.anchor_player_id into anchor_a
  from private.team_lineups tl
  where tl.team_match_id = tm.id and tl.team_id = tm.team_a_id;
  select tl.anchor_player_id into anchor_b
  from private.team_lineups tl
  where tl.team_match_id = tm.id and tl.team_id = tm.team_b_id;

  if anchor_a is null or anchor_b is null then
    raise exception 'Both postseason anchors must be locked before scoring can resolve a 2-2 tie';
  end if;

  select coalesce(max(r.round_number), 0) + 1 into next_tb_round
  from public.rounds r
  where r.season_id = tm.season_id and r.stage = 'tiebreaker';

  insert into public.rounds (season_id, round_number, stage, status)
  values (tm.season_id, next_tb_round, 'tiebreaker', 'in_progress')
  returning id into tb_round_id;

  insert into public.team_matches (
    season_id, round_id, table_number, team_a_id, team_b_id, status
  ) values (
    tm.season_id, tb_round_id, 1, tm.team_a_id, tm.team_b_id, 'in_progress'
  ) returning id into tb_team_match_id;

  insert into public.player_matches (
    season_id, round_id, team_match_id, slot_number,
    team_a_id, team_b_id, player_a_id, player_b_id, status
  ) values (
    tm.season_id, tb_round_id, tb_team_match_id, 1,
    tm.team_a_id, tm.team_b_id, anchor_a, anchor_b, 'scheduled'
  ) returning id into tb_player_match_id;

  insert into private.postseason_anchor_tiebreakers (
    season_id, parent_round_id, parent_team_match_id,
    tiebreaker_round_id, tiebreaker_team_match_id, anchor_player_match_id
  ) values (
    tm.season_id, tm.round_id, tm.id,
    tb_round_id, tb_team_match_id, tb_player_match_id
  );
end;
$$;

create or replace function private.refresh_postseason_team_match_from_player_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('finalized', 'corrected') and new.winner_side in ('A', 'B') then
    perform private.refresh_postseason_team_match(new.team_match_id);
  end if;
  return null;
end;
$$;

drop trigger if exists refresh_postseason_team_match_after_player_match on public.player_matches;
create trigger refresh_postseason_team_match_after_player_match
after update of status, winner_side on public.player_matches
for each row execute function private.refresh_postseason_team_match_from_player_match();

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
  resolved_semifinal_count integer;
  winner_team_ids uuid[];
begin
  if not exists (select 1 from private.league_admins la where la.user_id = actor_user_id) then
    raise exception 'Actor is not a league admin';
  end if;
  if not exists (select 1 from public.seasons s where s.id = target_season_id) then
    raise exception 'Season not found';
  end if;

  perform 1 from public.seasons s where s.id = target_season_id for update;

  select r.id into existing_round_id
  from public.rounds r
  where r.season_id = target_season_id and r.stage = 'championship'
  order by r.round_number limit 1;
  if existing_round_id is not null then
    return query
      select existing_round_id, tm.id, tm.team_a_id, tm.team_b_id
      from public.team_matches tm where tm.round_id = existing_round_id
      order by tm.table_number limit 1;
    return;
  end if;

  select r.id into semifinal_round_id
  from public.rounds r
  where r.season_id = target_season_id and r.stage = 'semifinal'
  order by r.round_number limit 1;
  if semifinal_round_id is null then raise exception 'Semifinals must be started before the championship'; end if;

  select count(*)::integer,
         count(*) filter (where tm.status = 'finalized' and tm.winner_team_id is not null)::integer,
         array_agg(tm.winner_team_id order by tm.table_number)
  into semifinal_match_count, resolved_semifinal_count, winner_team_ids
  from public.team_matches tm
  where tm.round_id = semifinal_round_id;

  if semifinal_match_count <> 2 then raise exception 'Exactly two semifinal team matchups are required'; end if;
  if resolved_semifinal_count <> 2 then
    raise exception 'Both semifinals must be finalized, including any required anchor tiebreaker';
  end if;
  if winner_team_ids[1] is null or winner_team_ids[2] is null or winner_team_ids[1] = winner_team_ids[2] then
    raise exception 'Two distinct semifinal winners are required';
  end if;

  update public.rounds set status = 'finalized' where id = semifinal_round_id;

  insert into public.rounds (season_id, round_number, stage, status)
  values (target_season_id, 9, 'championship', 'scheduled')
  returning id into created_round_id;

  insert into public.team_matches (
    season_id, round_id, table_number, team_a_id, team_b_id, status
  ) values (
    target_season_id, created_round_id, 1, winner_team_ids[1], winner_team_ids[2], 'scheduled'
  ) returning id into created_match_id;

  return query select created_round_id, created_match_id, winner_team_ids[1], winner_team_ids[2];
end;
$$;

revoke all on function public.advance_season_to_championship(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.advance_season_to_championship(uuid, uuid)
to service_role;

comment on function public.submit_postseason_lineup(uuid, uuid, uuid, uuid[], uuid) is
  'Trusted captain submission for a locked four-player postseason lineup and predeclared anchor.';
comment on table private.postseason_anchor_tiebreakers is
  'Links a tied four-match postseason team matchup to its automatically generated deciding anchor match.';
