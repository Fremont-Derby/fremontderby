-- Nightly lineup candidate read model and trusted eligibility checks.
-- Regular-season players may represent multiple teams in the same round, but never
-- more than once for the same team because each submitted team lineup is unique and
-- slot players are unique. The existing trigger remains the concurrency-safe 7-match cap.

-- The old availability read model carried two superseded assumptions:
--   1. free agents disappeared once a roster reached four players;
--   2. anyone rostered on another team was hidden from substitute discovery.
-- Replace it with a captain-only read model that shows the full own roster plus
-- explicitly available substitutes, together with hard eligibility blockers.

drop function if exists public.list_team_round_availability(uuid, uuid, uuid);

create function public.list_team_round_availability(
  actor_user_id uuid,
  target_team_id uuid,
  target_round_id uuid
)
returns table(
  season_id uuid,
  round_id uuid,
  team_id uuid,
  player_id uuid,
  display_name text,
  role text,
  participation_type text,
  fargo_rating integer,
  rating_status text,
  availability_status text,
  updated_at timestamptz,
  payment_status text,
  regular_matches_scheduled integer,
  eligible boolean,
  eligibility_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_round_id is null then raise exception 'target_round_id is required'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before viewing team availability'; end if;

  select t.season_id into target_season_id
  from public.teams t
  where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  if not exists (
    select 1 from public.rounds r
    where r.id = target_round_id and r.season_id = target_season_id and r.stage = 'regular'
  ) then raise exception 'Regular-season round not found for team season'; end if;

  if not exists (
    select 1 from public.team_matches tm
    where tm.round_id = target_round_id
      and (tm.team_a_id = target_team_id or tm.team_b_id = target_team_id)
  ) then raise exception 'Team is not scheduled for target round'; end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then raise exception 'Only the active captain can view team round availability'; end if;

  return query
  with scheduled_counts as (
    select tls.player_id, count(*)::integer as match_count
    from private.team_lineup_slots tls
    join public.rounds r on r.id = tls.round_id
    where tls.season_id = target_season_id
      and tls.player_id is not null
      and r.stage = 'regular'
    group by tls.player_id
  ),
  available_sub_ids as (
    -- Free agents who explicitly marked this round available.
    select fa.player_id, fa.updated_at
    from private.free_agent_availability fa
    join public.season_players sp
      on sp.season_id = fa.season_id and sp.player_id = fa.player_id
    where fa.season_id = target_season_id
      and fa.round_id = target_round_id
      and fa.status = 'available'
      and sp.status = 'active'

    union

    -- A rostered player may also substitute for another team in the same round.
    -- Their roster availability is player/round scoped by the existing key, so an
    -- explicit available status is sufficient; no season-wide membership exclusion.
    select ra.player_id, ra.updated_at
    from private.roster_availability ra
    where ra.season_id = target_season_id
      and ra.round_id = target_round_id
      and ra.status = 'available'
      and exists (
        select 1 from public.team_memberships other_tm
        where other_tm.season_id = target_season_id
          and other_tm.player_id = ra.player_id
          and other_tm.ends_at is null
      )
  ),
  candidates as (
    select
      0 as sort_order,
      tm.season_id,
      target_round_id as round_id,
      tm.team_id,
      p.id as player_id,
      p.display_name,
      tm.role,
      'roster'::text as participation_type,
      pr.fargo_rating,
      pr.rating_status,
      ra.status as availability_status,
      ra.updated_at
    from public.team_memberships tm
    join public.players p on p.id = tm.player_id
    left join public.player_ratings pr on pr.player_id = tm.player_id
    left join private.roster_availability ra
      on ra.round_id = target_round_id and ra.player_id = tm.player_id
    where tm.team_id = target_team_id
      and tm.season_id = target_season_id
      and tm.ends_at is null

    union all

    select
      1 as sort_order,
      target_season_id as season_id,
      target_round_id as round_id,
      target_team_id as team_id,
      p.id as player_id,
      p.display_name,
      null::text as role,
      'substitute'::text as participation_type,
      pr.fargo_rating,
      pr.rating_status,
      'available'::text as availability_status,
      max(available_sub_ids.updated_at) as updated_at
    from available_sub_ids
    join public.players p on p.id = available_sub_ids.player_id
    left join public.player_ratings pr on pr.player_id = p.id
    where not exists (
      select 1 from public.team_memberships own_tm
      where own_tm.season_id = target_season_id
        and own_tm.team_id = target_team_id
        and own_tm.player_id = p.id
        and own_tm.ends_at is null
    )
    group by p.id, p.display_name, pr.fargo_rating, pr.rating_status
  )
  select
    c.season_id,
    c.round_id,
    c.team_id,
    c.player_id,
    c.display_name,
    c.role,
    c.participation_type,
    c.fargo_rating,
    c.rating_status,
    c.availability_status,
    c.updated_at,
    coalesce(pay.status, 'unpaid') as payment_status,
    coalesce(sc.match_count, 0) as regular_matches_scheduled,
    (
      coalesce(pay.status, 'unpaid') in ('paid', 'waived')
      and coalesce(sc.match_count, 0) < 7
    ) as eligible,
    case
      when coalesce(pay.status, 'unpaid') not in ('paid', 'waived') then 'Payment required before playing'
      when coalesce(sc.match_count, 0) >= 7 then 'Season limit reached (7/7)'
      else null
    end as eligibility_reason
  from candidates c
  left join private.payment_status pay
    on pay.season_id = target_season_id and pay.player_id = c.player_id
  left join scheduled_counts sc on sc.player_id = c.player_id
  order by
    c.sort_order,
    case coalesce(c.availability_status, 'unsure')
      when 'available' then 0 when 'unsure' then 1 when 'unavailable' then 2 else 1 end,
    lower(c.display_name),
    c.player_id;
end;
$$;

revoke all on function public.list_team_round_availability(uuid, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.list_team_round_availability(uuid, uuid, uuid)
to service_role;

-- Keep the existing regular-season lineup shape and blind-lock behavior, while
-- allowing an explicitly available player from another roster to substitute.
-- Payment is a hard play eligibility rule and is rechecked here so the UI cannot
-- bypass it. The existing BEFORE trigger remains the authoritative 7-match cap.
create or replace function public.submit_team_lineup(
  actor_user_id uuid,
  target_team_id uuid,
  target_round_id uuid,
  lineup_slots jsonb
)
returns table(
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
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_round_id is null then raise exception 'target_round_id is required'; end if;
  if lineup_slots is null or jsonb_typeof(lineup_slots) is distinct from 'array' then
    raise exception 'lineup_slots must be an array';
  end if;
  if jsonb_array_length(lineup_slots) > 3 then
    raise exception 'Lineup cannot contain more than three slots';
  end if;

  select * into target_round
  from public.rounds r where r.id = target_round_id;
  if not found then raise exception 'Round not found'; end if;
  if target_round.stage <> 'regular' then raise exception 'Regular lineup is only valid for a regular-season round'; end if;
  if target_round.lineup_deadline_at is not null and now() > target_round.lineup_deadline_at then
    raise exception 'Lineup deadline has passed';
  end if;

  select * into target_match
  from public.team_matches tm
  where tm.round_id = target_round_id
    and (tm.team_a_id = target_team_id or tm.team_b_id = target_team_id)
  for update;
  if not found then raise exception 'Team is not scheduled for target round'; end if;

  select p.id into actor_player_id
  from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before submitting a lineup'; end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then raise exception 'Only the active captain can submit a lineup'; end if;

  if exists (
    select 1 from private.team_lineups existing_lineup
    where existing_lineup.team_match_id = target_match.id
      and existing_lineup.team_id = target_team_id
  ) then raise exception 'Lineup is locked after submission'; end if;

  if exists (
    select 1
    from (
      select coalesce((slot_item.value ->> 'slotNumber')::integer, slot_item.ordinality::integer) as slot_number
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
    ) parsed_slots
    where parsed_slots.slot_number < 1 or parsed_slots.slot_number > 3
  ) then raise exception 'Lineup slot numbers must be between 1 and 3'; end if;

  if exists (
    select 1
    from (
      select coalesce((slot_item.value ->> 'slotNumber')::integer, slot_item.ordinality::integer) as slot_number
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
    ) parsed_slots
    group by parsed_slots.slot_number
    having count(*) > 1
  ) then raise exception 'Lineup slot numbers must be unique'; end if;

  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    group by parsed_slots.player_id
    having count(*) > 1
  ) then raise exception 'Lineup players must be unique'; end if;

  -- All selected players must be paid (or explicitly waived) before they can play.
  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    where not exists (
      select 1 from private.payment_status ps
      where ps.season_id = target_match.season_id
        and ps.player_id = parsed_slots.player_id
        and ps.status in ('paid', 'waived')
    )
  ) then raise exception 'Every lineup player must be paid or waived before playing'; end if;

  -- Own-team roster players are always selectable (availability is advisory).
  -- Outside substitutes must explicitly be available for this round, either as a
  -- registered free agent or through roster availability on another active team.
  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    where not (
      exists (
        select 1 from public.team_memberships tm
        where tm.team_id = target_team_id
          and tm.season_id = target_match.season_id
          and tm.player_id = parsed_slots.player_id
          and tm.ends_at is null
      )
      or exists (
        select 1
        from private.free_agent_availability fa
        join public.season_players sp
          on sp.season_id = fa.season_id and sp.player_id = fa.player_id
        where fa.season_id = target_match.season_id
          and fa.round_id = target_round_id
          and fa.player_id = parsed_slots.player_id
          and fa.status = 'available'
          and sp.status = 'active'
      )
      or exists (
        select 1
        from private.roster_availability ra
        where ra.season_id = target_match.season_id
          and ra.round_id = target_round_id
          and ra.player_id = parsed_slots.player_id
          and ra.status = 'available'
          and exists (
            select 1 from public.team_memberships other_tm
            where other_tm.season_id = target_match.season_id
              and other_tm.player_id = parsed_slots.player_id
              and other_tm.ends_at is null
          )
      )
    )
  ) then raise exception 'Lineup player is not eligible for this team round'; end if;

  insert into private.team_lineups (
    season_id, round_id, team_match_id, team_id, submitted_by
  ) values (
    target_match.season_id, target_round_id, target_match.id, target_team_id, actor_user_id
  )
  on conflict on constraint team_lineups_team_match_id_team_id_key do update
    set submitted_by = excluded.submitted_by,
        submitted_at = now(),
        updated_at = now()
  returning team_lineups.id, team_lineups.submitted_at
  into saved_lineup_id, saved_submitted_at;

  delete from private.team_lineup_slots tls where tls.lineup_id = saved_lineup_id;

  insert into private.team_lineup_slots (
    lineup_id, season_id, round_id, team_id, slot_number, player_id, participation_type
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
        select 1 from public.team_memberships tm
        where tm.team_id = target_team_id
          and tm.season_id = target_match.season_id
          and tm.player_id = parsed_slots.player_id
          and tm.ends_at is null
      ) then 'roster'
      else 'free_agent' -- persisted legacy value; UI presents this as Substitute.
    end
  from generate_series(1, 3) as slot_numbers(slot_number)
  left join (
    select
      coalesce((slot_item.value ->> 'slotNumber')::integer, slot_item.ordinality::integer) as slot_number,
      nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
    from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
  ) parsed_slots on parsed_slots.slot_number = slot_numbers.slot_number
  order by slot_numbers.slot_number;

  return query
  select
    tl.id, tl.season_id, tl.round_id, tl.team_match_id, tl.team_id,
    tls.slot_number, tls.player_id, tls.participation_type, tl.submitted_at
  from private.team_lineups tl
  join private.team_lineup_slots tls on tls.lineup_id = tl.id
  where tl.id = saved_lineup_id
  order by tls.slot_number;
end;
$$;

revoke all on function public.submit_team_lineup(uuid, uuid, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.submit_team_lineup(uuid, uuid, uuid, jsonb)
to service_role;
