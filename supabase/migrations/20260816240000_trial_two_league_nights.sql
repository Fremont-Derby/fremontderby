-- #126 Trial players: up to two official league nights before payment is required.

create table if not exists private.player_trial_league_nights (
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  primary key (season_id, player_id, round_id)
);

create index if not exists player_trial_league_nights_player_idx
  on private.player_trial_league_nights (player_id, season_id);

alter table private.player_trial_league_nights enable row level security;
revoke all on table private.player_trial_league_nights from public, anon, authenticated;
grant select, insert on table private.player_trial_league_nights to service_role;

comment on table private.player_trial_league_nights is
  'Official league-night appearances while unpaid. One row per player/season/round; max 2 before payment is required (#126).';

create or replace function private.player_trial_nights_used(
  target_season_id uuid,
  target_player_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from private.player_trial_league_nights t
  where t.season_id = target_season_id
    and t.player_id = target_player_id;
$$;

revoke all on function private.player_trial_nights_used(uuid, uuid) from public, anon, authenticated;
grant execute on function private.player_trial_nights_used(uuid, uuid) to service_role;

-- True when player may appear in a scored lineup for this round.
create or replace function private.player_may_use_trial_or_paid(
  target_season_id uuid,
  target_player_id uuid,
  target_round_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  pay_status text;
  nights_used integer;
  already_this_round boolean;
begin
  select ps.status into pay_status
  from private.payment_status ps
  where ps.season_id = target_season_id
    and ps.player_id = target_player_id;

  if coalesce(pay_status, 'unpaid') in ('paid', 'waived') then
    return true;
  end if;

  select exists (
    select 1
    from private.player_trial_league_nights t
    where t.season_id = target_season_id
      and t.player_id = target_player_id
      and t.round_id = target_round_id
  ) into already_this_round;

  -- Re-submitting the same night does not consume an extra trial.
  if already_this_round then
    return true;
  end if;

  nights_used := private.player_trial_nights_used(target_season_id, target_player_id);
  return nights_used < 2;
end;
$$;

revoke all on function private.player_may_use_trial_or_paid(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function private.player_may_use_trial_or_paid(uuid, uuid, uuid) to service_role;

-- Prize eligibility: paid or waived only (trial results count in standings but not payouts).
create or replace function private.player_prize_eligible(
  target_season_id uuid,
  target_player_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.payment_status ps
    where ps.season_id = target_season_id
      and ps.player_id = target_player_id
      and ps.status in ('paid', 'waived')
  );
$$;

revoke all on function private.player_prize_eligible(uuid, uuid) from public, anon, authenticated;
grant execute on function private.player_prize_eligible(uuid, uuid) to service_role;
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

  -- Paid/waived always OK; unpaid players may use up to 2 official trial league nights (#126).
  if exists (
    select 1
    from (
      select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
      from jsonb_array_elements(lineup_slots) with ordinality as slot_item(value, ordinality)
      where nullif(slot_item.value ->> 'playerId', '') is not null
    ) parsed_slots
    where not private.player_may_use_trial_or_paid(
      target_match.season_id,
      parsed_slots.player_id,
      target_round_id
    )
  ) then raise exception 'Payment required after two free league nights (or player must be paid/waived)'; end if;

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


  -- Record trial league-night appearances for unpaid players (one row per round).
  insert into private.player_trial_league_nights (season_id, player_id, round_id)
  select distinct target_match.season_id, parsed.player_id, target_round_id
  from (
    select nullif(slot_item.value ->> 'playerId', '')::uuid as player_id
    from jsonb_array_elements(lineup_slots) as slot_item(value)
    where nullif(slot_item.value ->> 'playerId', '') is not null
  ) parsed
  left join private.payment_status ps
    on ps.season_id = target_match.season_id
   and ps.player_id = parsed.player_id
  where coalesce(ps.status, 'unpaid') not in ('paid', 'waived')
  on conflict do nothing;

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

comment on function public.submit_team_lineup(uuid, uuid, uuid, jsonb) is
  'Captain boundary for weekly lineups. Unpaid players may appear on up to two official league nights; further nights require paid/waived (#126).';
