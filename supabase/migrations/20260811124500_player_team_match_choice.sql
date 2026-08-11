-- A player who belongs to both teams in one head-to-head matchup chooses the
-- team they will represent before either captain may lock them into a lineup.
-- Every lineup path also enforces one appearance per player per team matchup.

create table private.team_match_player_choices (
  team_match_id uuid not null references public.team_matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  chosen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_match_id, player_id)
);

create index team_match_player_choices_player_idx
  on private.team_match_player_choices (player_id, team_match_id);
create index team_match_player_choices_team_idx
  on private.team_match_player_choices (team_id);

alter table private.team_match_player_choices enable row level security;
revoke all on table private.team_match_player_choices from public, anon, authenticated;
grant select, insert, update, delete on table private.team_match_player_choices to service_role;

create function public.list_my_team_match_choices(actor_user_id uuid)
returns table(
  team_match_id uuid,
  season_id uuid,
  round_id uuid,
  round_number integer,
  scheduled_on date,
  stage text,
  team_a_id uuid,
  team_a_name text,
  team_b_id uuid,
  team_b_name text,
  selected_team_id uuid,
  choice_locked boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before choosing a team'; end if;

  return query
  select
    tm.id,
    tm.season_id,
    tm.round_id,
    r.round_number,
    r.scheduled_on,
    r.stage::text,
    tm.team_a_id,
    team_a.name,
    tm.team_b_id,
    team_b.name,
    choice.team_id,
    exists (
      select 1
      from private.team_lineups lineup
      join private.team_lineup_slots slot on slot.lineup_id = lineup.id
      where lineup.team_match_id = tm.id
        and slot.player_id = actor_player_id
    )
  from public.team_matches tm
  join public.rounds r on r.id = tm.round_id
  join public.teams team_a on team_a.id = tm.team_a_id
  join public.teams team_b on team_b.id = tm.team_b_id
  left join private.team_match_player_choices choice
    on choice.team_match_id = tm.id and choice.player_id = actor_player_id
  where tm.status not in ('finalized', 'corrected')
    and exists (
      select 1 from public.team_memberships member_a
      where member_a.season_id = tm.season_id
        and member_a.team_id = tm.team_a_id
        and member_a.player_id = actor_player_id
        and member_a.ends_at is null
    )
    and exists (
      select 1 from public.team_memberships member_b
      where member_b.season_id = tm.season_id
        and member_b.team_id = tm.team_b_id
        and member_b.player_id = actor_player_id
        and member_b.ends_at is null
    )
  order by r.scheduled_on nulls last, r.round_number, tm.table_number, tm.id;
end;
$$;

create function public.choose_team_match_team(
  actor_user_id uuid,
  target_team_match_id uuid,
  target_team_id uuid
)
returns table(
  team_match_id uuid,
  player_id uuid,
  team_id uuid,
  chosen_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_match public.team_matches%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_match_id is null then raise exception 'target_team_match_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before choosing a team'; end if;

  select * into target_match
  from public.team_matches tm
  where tm.id = target_team_match_id
  for update;
  if not found then raise exception 'Team matchup not found'; end if;

  if target_team_id not in (target_match.team_a_id, target_match.team_b_id) then
    raise exception 'Selected team is not part of this team matchup';
  end if;

  if not exists (
    select 1 from public.team_memberships member_a
    where member_a.season_id = target_match.season_id
      and member_a.team_id = target_match.team_a_id
      and member_a.player_id = actor_player_id
      and member_a.ends_at is null
  ) or not exists (
    select 1 from public.team_memberships member_b
    where member_b.season_id = target_match.season_id
      and member_b.team_id = target_match.team_b_id
      and member_b.player_id = actor_player_id
      and member_b.ends_at is null
  ) then
    raise exception 'You must be an active member of both teams to choose a side for this matchup';
  end if;

  if exists (
    select 1
    from private.team_lineups lineup
    join private.team_lineup_slots slot on slot.lineup_id = lineup.id
    where lineup.team_match_id = target_team_match_id
      and slot.player_id = actor_player_id
  ) then
    raise exception 'Team choice is locked after a lineup includes you';
  end if;

  insert into private.team_match_player_choices (
    team_match_id, player_id, team_id
  ) values (
    target_team_match_id, actor_player_id, target_team_id
  )
  on conflict (team_match_id, player_id) do update
    set team_id = excluded.team_id,
        updated_at = now();

  return query
  select choice.team_match_id, choice.player_id, choice.team_id,
         choice.chosen_at, choice.updated_at
  from private.team_match_player_choices choice
  where choice.team_match_id = target_team_match_id
    and choice.player_id = actor_player_id;
end;
$$;

revoke all on function public.list_my_team_match_choices(uuid)
from public, anon, authenticated;
grant execute on function public.list_my_team_match_choices(uuid) to service_role;

revoke all on function public.choose_team_match_team(uuid, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.choose_team_match_team(uuid, uuid, uuid) to service_role;

create function private.enforce_one_player_per_team_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_lineup private.team_lineups%rowtype;
  target_match public.team_matches%rowtype;
  selected_team_id uuid;
begin
  if new.player_id is null then return new; end if;

  select * into target_lineup
  from private.team_lineups lineup
  where lineup.id = new.lineup_id;
  if not found then raise exception 'Lineup not found for slot'; end if;

  select * into target_match
  from public.team_matches tm
  where tm.id = target_lineup.team_match_id;
  if not found then raise exception 'Team matchup not found for lineup'; end if;

  if target_lineup.team_id not in (target_match.team_a_id, target_match.team_b_id) then
    raise exception 'Lineup team is not part of this matchup';
  end if;

  if exists (
    select 1
    from private.team_lineup_slots other_slot
    join private.team_lineups other_lineup on other_lineup.id = other_slot.lineup_id
    where other_lineup.team_match_id = target_lineup.team_match_id
      and other_slot.player_id = new.player_id
      and not (
        other_slot.lineup_id = new.lineup_id
        and other_slot.slot_number = new.slot_number
      )
  ) then
    raise exception 'A player cannot appear twice in the same team matchup';
  end if;

  if exists (
    select 1 from public.team_memberships member_a
    where member_a.season_id = target_match.season_id
      and member_a.team_id = target_match.team_a_id
      and member_a.player_id = new.player_id
      and member_a.ends_at is null
  ) and exists (
    select 1 from public.team_memberships member_b
    where member_b.season_id = target_match.season_id
      and member_b.team_id = target_match.team_b_id
      and member_b.player_id = new.player_id
      and member_b.ends_at is null
  ) then
    select choice.team_id into selected_team_id
    from private.team_match_player_choices choice
    where choice.team_match_id = target_lineup.team_match_id
      and choice.player_id = new.player_id;

    if selected_team_id is null then
      raise exception 'Player must choose a team for this matchup before lineups are locked';
    end if;
    if selected_team_id <> target_lineup.team_id then
      raise exception 'Player chose the opposing team for this matchup';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_one_player_per_team_match on private.team_lineup_slots;
create trigger enforce_one_player_per_team_match
before insert or update of lineup_id, slot_number, player_id
on private.team_lineup_slots
for each row execute function private.enforce_one_player_per_team_match();

-- Keep the captain picker honest before submission. Dual-rostered players are
-- blocked until their choice matches this team, and any player already committed
-- to the opposing lineup is blocked without revealing the opposing order.
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
  target_match public.team_matches%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_round_id is null then raise exception 'target_round_id is required'; end if;

  select p.id into actor_player_id
  from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before viewing team availability'; end if;

  select t.season_id into target_season_id
  from public.teams t where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  if not exists (
    select 1 from public.rounds r
    where r.id = target_round_id and r.season_id = target_season_id and r.stage = 'regular'
  ) then raise exception 'Regular-season round not found for team season'; end if;

  select * into target_match
  from public.team_matches tm
  where tm.round_id = target_round_id
    and (tm.team_a_id = target_team_id or tm.team_b_id = target_team_id);
  if not found then raise exception 'Team is not scheduled for target round'; end if;

  if not exists (
    select 1 from public.team_memberships membership
    where membership.team_id = target_team_id
      and membership.player_id = actor_player_id
      and membership.role = 'captain'
      and membership.ends_at is null
  ) then raise exception 'Only the active captain can view team round availability'; end if;

  return query
  with scheduled_counts as (
    select slot.player_id, count(*)::integer as match_count
    from private.team_lineup_slots slot
    join public.rounds r on r.id = slot.round_id
    where slot.season_id = target_season_id
      and slot.player_id is not null
      and r.stage = 'regular'
    group by slot.player_id
  ),
  available_sub_ids as (
    select fa.player_id, fa.updated_at
    from private.free_agent_availability fa
    join public.season_players sp
      on sp.season_id = fa.season_id and sp.player_id = fa.player_id
    where fa.season_id = target_season_id
      and fa.round_id = target_round_id
      and fa.status = 'available'
      and sp.status = 'active'
    union
    select ra.player_id, ra.updated_at
    from private.roster_availability ra
    where ra.season_id = target_season_id
      and ra.round_id = target_round_id
      and ra.status = 'available'
      and exists (
        select 1 from public.team_memberships other_membership
        where other_membership.season_id = target_season_id
          and other_membership.player_id = ra.player_id
          and other_membership.ends_at is null
      )
  ),
  candidates as (
    select
      0 as sort_order, membership.season_id, target_round_id as round_id,
      membership.team_id, p.id as player_id, p.display_name, membership.role,
      'roster'::text as participation_type, rating.fargo_rating,
      rating.rating_status, availability.status as availability_status,
      availability.updated_at
    from public.team_memberships membership
    join public.players p on p.id = membership.player_id
    left join public.player_ratings rating on rating.player_id = membership.player_id
    left join private.roster_availability availability
      on availability.round_id = target_round_id and availability.player_id = membership.player_id
    where membership.team_id = target_team_id
      and membership.season_id = target_season_id
      and membership.ends_at is null
    union all
    select
      1 as sort_order, target_season_id, target_round_id, target_team_id,
      p.id, p.display_name, null::text, 'substitute'::text,
      rating.fargo_rating, rating.rating_status, 'available'::text,
      max(available_sub_ids.updated_at)
    from available_sub_ids
    join public.players p on p.id = available_sub_ids.player_id
    left join public.player_ratings rating on rating.player_id = p.id
    where not exists (
      select 1 from public.team_memberships own_membership
      where own_membership.season_id = target_season_id
        and own_membership.team_id = target_team_id
        and own_membership.player_id = p.id
        and own_membership.ends_at is null
    )
    group by p.id, p.display_name, rating.fargo_rating, rating.rating_status
  ),
  choice_state as (
    select
      candidate.*,
      exists (
        select 1 from public.team_memberships member_a
        where member_a.season_id = target_season_id
          and member_a.team_id = target_match.team_a_id
          and member_a.player_id = candidate.player_id
          and member_a.ends_at is null
      ) and exists (
        select 1 from public.team_memberships member_b
        where member_b.season_id = target_season_id
          and member_b.team_id = target_match.team_b_id
          and member_b.player_id = candidate.player_id
          and member_b.ends_at is null
      ) as needs_choice,
      (
        select choice.team_id
        from private.team_match_player_choices choice
        where choice.team_match_id = target_match.id
          and choice.player_id = candidate.player_id
      ) as selected_team_id,
      exists (
        select 1
        from private.team_lineups opposing_lineup
        join private.team_lineup_slots opposing_slot
          on opposing_slot.lineup_id = opposing_lineup.id
        where opposing_lineup.team_match_id = target_match.id
          and opposing_lineup.team_id <> target_team_id
          and opposing_slot.player_id = candidate.player_id
      ) as already_opponent
    from candidates candidate
  )
  select
    state.season_id, state.round_id, state.team_id, state.player_id,
    state.display_name, state.role, state.participation_type,
    state.fargo_rating, state.rating_status, state.availability_status,
    state.updated_at, coalesce(payment.status, 'unpaid'),
    coalesce(scheduled.match_count, 0),
    (
      coalesce(payment.status, 'unpaid') in ('paid', 'waived')
      and coalesce(scheduled.match_count, 0) < 7
      and not state.already_opponent
      and (not state.needs_choice or state.selected_team_id = target_team_id)
    ),
    case
      when coalesce(payment.status, 'unpaid') not in ('paid', 'waived')
        then 'Payment required before playing'
      when coalesce(scheduled.match_count, 0) >= 7
        then 'Season limit reached (7/7)'
      when state.already_opponent
        then 'Already committed in this matchup'
      when state.needs_choice and state.selected_team_id is null
        then 'Player must choose a team for this matchup'
      when state.needs_choice and state.selected_team_id <> target_team_id
        then 'Playing for the opponent in this matchup'
      else null
    end
  from choice_state state
  left join private.payment_status payment
    on payment.season_id = target_season_id and payment.player_id = state.player_id
  left join scheduled_counts scheduled on scheduled.player_id = state.player_id
  order by
    state.sort_order,
    case coalesce(state.availability_status, 'unsure')
      when 'available' then 0 when 'unsure' then 1 when 'unavailable' then 2 else 1 end,
    lower(state.display_name), state.player_id;
end;
$$;

revoke all on function public.list_team_round_availability(uuid, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.list_team_round_availability(uuid, uuid, uuid)
to service_role;

comment on table private.team_match_player_choices is
  'A dual-rostered player choice of exactly one team for a head-to-head matchup.';
comment on function public.choose_team_match_team(uuid, uuid, uuid) is
  'Trusted player action that chooses one represented team before blind lineups lock.';
comment on function private.enforce_one_player_per_team_match() is
  'Prevents any player from appearing twice in one team matchup and enforces dual-team choice.';
