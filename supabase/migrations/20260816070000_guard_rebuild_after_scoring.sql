-- P0: guard player-match regen after scoring. Explicit CREATE OR REPLACE (no regexp patching).
-- Refuse rebuild when any linked player match is in_progress/finalized/corrected, or racks exist.

-- private / public
CREATE OR REPLACE FUNCTION private.rebuild_generated_team_match_results(target_team_match_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  -- P0: do not wipe scored / in-progress player matches on lineup churn.
  if exists (
    select 1
    from public.player_matches pm
    where pm.team_match_id = target_team_match_id
      and pm.status in ('in_progress', 'finalized', 'corrected')
  ) then
    raise exception 'Cannot regenerate player matches after scoring has started for this team match';
  end if;

  if exists (
    select 1
    from public.player_match_racks r
    join public.player_matches pm on pm.id = r.player_match_id
    where pm.team_match_id = target_team_match_id
  ) then
    raise exception 'Cannot regenerate player matches after racks have been recorded for this team match';
  end if;


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
$function$;

-- jfl_private / jfl
CREATE OR REPLACE FUNCTION jfl_private.rebuild_generated_team_match_results(target_team_match_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  target_match jfl.team_matches%rowtype;
  target_round jfl.rounds%rowtype;
  team_a_lineup_id uuid;
  team_b_lineup_id uuid;
  team_a_slot_count integer;
  team_b_slot_count integer;
  submitted_lineup_count integer;
  expected_slots integer;
begin
  select * into target_match
  from jfl.team_matches tm
  where tm.id = target_team_match_id;

  if not found then return; end if;

  -- P0: do not wipe scored / in-progress player matches on lineup churn.
  if exists (
    select 1
    from jfl.player_matches pm
    where pm.team_match_id = target_team_match_id
      and pm.status in ('in_progress', 'finalized', 'corrected')
  ) then
    raise exception 'Cannot regenerate player matches after scoring has started for this team match';
  end if;

  if exists (
    select 1
    from jfl.player_match_racks r
    join jfl.player_matches pm on pm.id = r.player_match_id
    where pm.team_match_id = target_team_match_id
  ) then
    raise exception 'Cannot regenerate player matches after racks have been recorded for this team match';
  end if;


  select * into target_round
  from jfl.rounds r
  where r.id = target_match.round_id;

  if target_round.stage = 'tiebreaker' then return; end if;
  expected_slots := case when target_round.stage = 'regular' then 3 else 4 end;

  delete from jfl.player_matches pm where pm.team_match_id = target_team_match_id;
  delete from jfl.team_match_forfeits tmf where tmf.team_match_id = target_team_match_id;

  select count(*)::integer into submitted_lineup_count
  from jfl_private.team_lineups tl where tl.team_match_id = target_team_match_id;

  select tl.id into team_a_lineup_id
  from jfl_private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_a_id;

  select tl.id into team_b_lineup_id
  from jfl_private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_b_id;

  if team_a_lineup_id is null or team_b_lineup_id is null then
    if submitted_lineup_count > 0 and target_match.status = 'scheduled' then
      update jfl.team_matches set status = 'lineups_due' where id = target_team_match_id;
    end if;
    return;
  end if;

  select count(*)::integer into team_a_slot_count
  from jfl_private.team_lineup_slots tls where tls.lineup_id = team_a_lineup_id;
  select count(*)::integer into team_b_slot_count
  from jfl_private.team_lineup_slots tls where tls.lineup_id = team_b_lineup_id;

  if team_a_slot_count <> expected_slots or team_b_slot_count <> expected_slots then return; end if;

  insert into jfl.player_matches (
    season_id, round_id, team_match_id, slot_number,
    team_a_id, team_b_id, player_a_id, player_b_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id, target_match.team_b_id,
         a.player_id, b.player_id
  from jfl_private.team_lineup_slots a
  join jfl_private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id
    and a.player_id is not null and b.player_id is not null
  order by a.slot_number;

  insert into jfl.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id,
         case when b.player_id is not null then target_match.team_b_id else null end
  from jfl_private.team_lineup_slots a
  join jfl_private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id and a.player_id is null;

  insert into jfl.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         b.slot_number, target_match.team_b_id,
         case when a.player_id is not null then target_match.team_a_id else null end
  from jfl_private.team_lineup_slots b
  join jfl_private.team_lineup_slots a
    on a.lineup_id = team_a_lineup_id and a.slot_number = b.slot_number
  where b.lineup_id = team_b_lineup_id and b.player_id is null;

  update jfl.team_matches
  set status = 'in_progress'
  where id = target_team_match_id and status in ('scheduled', 'lineups_due');
end;
$function$;

-- dru_private / dru
CREATE OR REPLACE FUNCTION dru_private.rebuild_generated_team_match_results(target_team_match_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  target_match dru.team_matches%rowtype;
  target_round dru.rounds%rowtype;
  team_a_lineup_id uuid;
  team_b_lineup_id uuid;
  team_a_slot_count integer;
  team_b_slot_count integer;
  submitted_lineup_count integer;
  expected_slots integer;
begin
  select * into target_match
  from dru.team_matches tm
  where tm.id = target_team_match_id;

  if not found then return; end if;

  -- P0: do not wipe scored / in-progress player matches on lineup churn.
  if exists (
    select 1
    from dru.player_matches pm
    where pm.team_match_id = target_team_match_id
      and pm.status in ('in_progress', 'finalized', 'corrected')
  ) then
    raise exception 'Cannot regenerate player matches after scoring has started for this team match';
  end if;

  if exists (
    select 1
    from dru.player_match_racks r
    join dru.player_matches pm on pm.id = r.player_match_id
    where pm.team_match_id = target_team_match_id
  ) then
    raise exception 'Cannot regenerate player matches after racks have been recorded for this team match';
  end if;


  select * into target_round
  from dru.rounds r
  where r.id = target_match.round_id;

  if target_round.stage = 'tiebreaker' then return; end if;
  expected_slots := case when target_round.stage = 'regular' then 3 else 4 end;

  delete from dru.player_matches pm where pm.team_match_id = target_team_match_id;
  delete from dru.team_match_forfeits tmf where tmf.team_match_id = target_team_match_id;

  select count(*)::integer into submitted_lineup_count
  from dru_private.team_lineups tl where tl.team_match_id = target_team_match_id;

  select tl.id into team_a_lineup_id
  from dru_private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_a_id;

  select tl.id into team_b_lineup_id
  from dru_private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_b_id;

  if team_a_lineup_id is null or team_b_lineup_id is null then
    if submitted_lineup_count > 0 and target_match.status = 'scheduled' then
      update dru.team_matches set status = 'lineups_due' where id = target_team_match_id;
    end if;
    return;
  end if;

  select count(*)::integer into team_a_slot_count
  from dru_private.team_lineup_slots tls where tls.lineup_id = team_a_lineup_id;
  select count(*)::integer into team_b_slot_count
  from dru_private.team_lineup_slots tls where tls.lineup_id = team_b_lineup_id;

  if team_a_slot_count <> expected_slots or team_b_slot_count <> expected_slots then return; end if;

  insert into dru.player_matches (
    season_id, round_id, team_match_id, slot_number,
    team_a_id, team_b_id, player_a_id, player_b_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id, target_match.team_b_id,
         a.player_id, b.player_id
  from dru_private.team_lineup_slots a
  join dru_private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id
    and a.player_id is not null and b.player_id is not null
  order by a.slot_number;

  insert into dru.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id,
         case when b.player_id is not null then target_match.team_b_id else null end
  from dru_private.team_lineup_slots a
  join dru_private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id and a.player_id is null;

  insert into dru.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         b.slot_number, target_match.team_b_id,
         case when a.player_id is not null then target_match.team_a_id else null end
  from dru_private.team_lineup_slots b
  join dru_private.team_lineup_slots a
    on a.lineup_id = team_a_lineup_id and a.slot_number = b.slot_number
  where b.lineup_id = team_b_lineup_id and b.player_id is null;

  update dru.team_matches
  set status = 'in_progress'
  where id = target_team_match_id and status in ('scheduled', 'lineups_due');
end;
$function$;

-- gamma_private / gamma
CREATE OR REPLACE FUNCTION gamma_private.rebuild_generated_team_match_results(target_team_match_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  target_match gamma.team_matches%rowtype;
  target_round gamma.rounds%rowtype;
  team_a_lineup_id uuid;
  team_b_lineup_id uuid;
  team_a_slot_count integer;
  team_b_slot_count integer;
  submitted_lineup_count integer;
  expected_slots integer;
begin
  select * into target_match
  from gamma.team_matches tm
  where tm.id = target_team_match_id;

  if not found then return; end if;

  -- P0: do not wipe scored / in-progress player matches on lineup churn.
  if exists (
    select 1
    from gamma.player_matches pm
    where pm.team_match_id = target_team_match_id
      and pm.status in ('in_progress', 'finalized', 'corrected')
  ) then
    raise exception 'Cannot regenerate player matches after scoring has started for this team match';
  end if;

  if exists (
    select 1
    from gamma.player_match_racks r
    join gamma.player_matches pm on pm.id = r.player_match_id
    where pm.team_match_id = target_team_match_id
  ) then
    raise exception 'Cannot regenerate player matches after racks have been recorded for this team match';
  end if;


  select * into target_round
  from gamma.rounds r
  where r.id = target_match.round_id;

  if target_round.stage = 'tiebreaker' then return; end if;
  expected_slots := case when target_round.stage = 'regular' then 3 else 4 end;

  delete from gamma.player_matches pm where pm.team_match_id = target_team_match_id;
  delete from gamma.team_match_forfeits tmf where tmf.team_match_id = target_team_match_id;

  select count(*)::integer into submitted_lineup_count
  from gamma_private.team_lineups tl where tl.team_match_id = target_team_match_id;

  select tl.id into team_a_lineup_id
  from gamma_private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_a_id;

  select tl.id into team_b_lineup_id
  from gamma_private.team_lineups tl
  where tl.team_match_id = target_team_match_id and tl.team_id = target_match.team_b_id;

  if team_a_lineup_id is null or team_b_lineup_id is null then
    if submitted_lineup_count > 0 and target_match.status = 'scheduled' then
      update gamma.team_matches set status = 'lineups_due' where id = target_team_match_id;
    end if;
    return;
  end if;

  select count(*)::integer into team_a_slot_count
  from gamma_private.team_lineup_slots tls where tls.lineup_id = team_a_lineup_id;
  select count(*)::integer into team_b_slot_count
  from gamma_private.team_lineup_slots tls where tls.lineup_id = team_b_lineup_id;

  if team_a_slot_count <> expected_slots or team_b_slot_count <> expected_slots then return; end if;

  insert into gamma.player_matches (
    season_id, round_id, team_match_id, slot_number,
    team_a_id, team_b_id, player_a_id, player_b_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id, target_match.team_b_id,
         a.player_id, b.player_id
  from gamma_private.team_lineup_slots a
  join gamma_private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id
    and a.player_id is not null and b.player_id is not null
  order by a.slot_number;

  insert into gamma.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         a.slot_number, target_match.team_a_id,
         case when b.player_id is not null then target_match.team_b_id else null end
  from gamma_private.team_lineup_slots a
  join gamma_private.team_lineup_slots b
    on b.lineup_id = team_b_lineup_id and b.slot_number = a.slot_number
  where a.lineup_id = team_a_lineup_id and a.player_id is null;

  insert into gamma.team_match_forfeits (
    season_id, round_id, team_match_id, slot_number, forfeiting_team_id, credited_team_id
  )
  select target_match.season_id, target_match.round_id, target_match.id,
         b.slot_number, target_match.team_b_id,
         case when a.player_id is not null then target_match.team_a_id else null end
  from gamma_private.team_lineup_slots b
  join gamma_private.team_lineup_slots a
    on a.lineup_id = team_a_lineup_id and a.slot_number = b.slot_number
  where b.lineup_id = team_b_lineup_id and b.player_id is null;

  update gamma.team_matches
  set status = 'in_progress'
  where id = target_team_match_id and status in ('scheduled', 'lineups_due');
end;
$function$;
