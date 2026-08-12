-- Make date-keyed availability authoritative for captain lineup planning while
-- keeping the existing round-shaped HTTP/RPC contracts compatible during the
-- /availability -> /schedule transition.
--
-- Schedule writes private.player_date_availability. Captain discovery now reads
-- that table directly using the selected round's scheduled_on date. Legacy
-- round-scoped availability rows remain only as a compatibility cache for the
-- current submit_team_lineup implementation and old API callers; all supported
-- availability setters are routed through the date-keyed source of truth.

create or replace function public.set_own_date_availability(
  actor_user_id uuid,
  target_season_id uuid,
  target_availability_date date,
  target_availability_status text
)
returns table (
  season_id uuid,
  player_id uuid,
  availability_date date,
  availability_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_player_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if target_availability_date is null then raise exception 'target_availability_date is required'; end if;
  if target_availability_status not in ('available', 'unsure', 'unavailable') then
    raise exception 'availability_status must be available, unsure, or unavailable';
  end if;

  select p.id into target_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if target_player_id is null then raise exception 'Player profile is required'; end if;

  if not exists (
    select 1
    from public.season_players sp
    where sp.season_id = target_season_id
      and sp.player_id = target_player_id
      and sp.status = 'active'
  ) then
    raise exception 'Active season registration is required to set availability';
  end if;

  if not exists (
    select 1
    from public.rounds r
    where r.season_id = target_season_id
      and r.scheduled_on = target_availability_date
  ) then
    raise exception 'Availability date is not a scheduled league date for this season';
  end if;

  insert into private.player_date_availability(
    season_id,
    player_id,
    availability_date,
    status,
    updated_at
  ) values (
    target_season_id,
    target_player_id,
    target_availability_date,
    target_availability_status,
    now()
  )
  on conflict on constraint player_date_availability_pkey do update
  set status = excluded.status,
      updated_at = now();

  -- Compatibility cache for submit_team_lineup while it still accepts the old
  -- round-shaped availability tables. This does not become a second source of
  -- truth: every supported write reaches this function first.
  insert into private.free_agent_availability(
    season_id,
    round_id,
    player_id,
    status,
    updated_at
  )
  select
    target_season_id,
    r.id,
    target_player_id,
    target_availability_status,
    now()
  from public.rounds r
  where r.season_id = target_season_id
    and r.scheduled_on = target_availability_date
  on conflict (round_id, player_id) do update
  set status = excluded.status,
      updated_at = now();

  -- Neutralize any older roster-scoped cache row for the same player/date so an
  -- obsolete 'available' value cannot override an Unavailable/Unsure date state.
  update private.roster_availability ra
  set status = target_availability_status,
      updated_at = now()
  where ra.season_id = target_season_id
    and ra.player_id = target_player_id
    and exists (
      select 1
      from public.rounds r
      where r.id = ra.round_id
        and r.season_id = target_season_id
        and r.scheduled_on = target_availability_date
    );

  return query
  select pda.season_id, pda.player_id, pda.availability_date, pda.status, pda.updated_at
  from private.player_date_availability pda
  where pda.season_id = target_season_id
    and pda.player_id = target_player_id
    and pda.availability_date = target_availability_date;
end;
$$;

revoke all on function public.set_own_date_availability(uuid, uuid, date, text)
  from public, anon, authenticated;
grant execute on function public.set_own_date_availability(uuid, uuid, date, text)
  to service_role;

-- Existing legacy availability rows may predate the date-keyed source. Make them
-- safe compatibility caches immediately: a missing date response means Unsure.
update private.free_agent_availability fa
set status = coalesce((
      select pda.status
      from public.rounds r
      left join private.player_date_availability pda
        on pda.season_id = fa.season_id
       and pda.player_id = fa.player_id
       and pda.availability_date = r.scheduled_on
      where r.id = fa.round_id
        and r.season_id = fa.season_id
    ), 'unsure'),
    updated_at = now()
where exists (
  select 1 from public.rounds r
  where r.id = fa.round_id and r.scheduled_on is not null
);

update private.roster_availability ra
set status = coalesce((
      select pda.status
      from public.rounds r
      left join private.player_date_availability pda
        on pda.season_id = ra.season_id
       and pda.player_id = ra.player_id
       and pda.availability_date = r.scheduled_on
      where r.id = ra.round_id
        and r.season_id = ra.season_id
    ), 'unsure'),
    updated_at = now()
where exists (
  select 1 from public.rounds r
  where r.id = ra.round_id and r.scheduled_on is not null
);

insert into private.free_agent_availability(
  season_id,
  round_id,
  player_id,
  status,
  updated_at
)
select
  pda.season_id,
  r.id,
  pda.player_id,
  pda.status,
  pda.updated_at
from private.player_date_availability pda
join public.rounds r
  on r.season_id = pda.season_id
 and r.scheduled_on = pda.availability_date
join public.season_players sp
  on sp.season_id = pda.season_id
 and sp.player_id = pda.player_id
 and sp.status = 'active'
on conflict (round_id, player_id) do update
set status = excluded.status,
    updated_at = excluded.updated_at;

-- Legacy roster setter: retain the RPC shape for old clients, but route the write
-- through the date-keyed command so it cannot diverge from Schedule.
create or replace function public.set_roster_availability(
  actor_user_id uuid,
  target_round_id uuid,
  availability_status text
)
returns table (
  season_id uuid,
  round_id uuid,
  team_id uuid,
  player_id uuid,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_round public.rounds%rowtype;
  actor_team_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_round_id is null then raise exception 'target_round_id is required'; end if;
  if availability_status not in ('available', 'unavailable', 'unsure') then
    raise exception 'availability_status must be available, unavailable, or unsure';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before setting roster availability'; end if;

  select * into target_round
  from public.rounds r
  where r.id = target_round_id;
  if not found then raise exception 'Round not found'; end if;
  if target_round.scheduled_on is null then raise exception 'Round does not have a scheduled date'; end if;

  select tm.team_id into actor_team_id
  from public.team_memberships tm
  where tm.season_id = target_round.season_id
    and tm.player_id = actor_player_id
    and tm.ends_at is null
  order by tm.created_at, tm.team_id
  limit 1;
  if not found then raise exception 'Active roster membership is required before setting availability'; end if;

  perform * from public.set_own_date_availability(
    actor_user_id,
    target_round.season_id,
    target_round.scheduled_on,
    availability_status
  );

  return query
  select
    target_round.season_id,
    target_round.id,
    actor_team_id,
    actor_player_id,
    pda.status,
    pda.updated_at
  from private.player_date_availability pda
  where pda.season_id = target_round.season_id
    and pda.player_id = actor_player_id
    and pda.availability_date = target_round.scheduled_on;
end;
$$;

revoke all on function public.set_roster_availability(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_roster_availability(uuid, uuid, text)
  to service_role;

-- Legacy free-agent setter receives the same compatibility treatment.
create or replace function public.set_free_agent_availability(
  actor_user_id uuid,
  target_round_id uuid,
  availability_status text
)
returns table (
  season_id uuid,
  round_id uuid,
  player_id uuid,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_round public.rounds%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_round_id is null then raise exception 'target_round_id is required'; end if;
  if availability_status not in ('available', 'unavailable', 'unsure') then
    raise exception 'availability_status must be available, unavailable, or unsure';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before setting availability'; end if;

  select * into target_round
  from public.rounds r
  where r.id = target_round_id;
  if not found then raise exception 'Round not found'; end if;
  if target_round.scheduled_on is null then raise exception 'Round does not have a scheduled date'; end if;

  if not exists (
    select 1
    from public.season_players sp
    where sp.season_id = target_round.season_id
      and sp.player_id = actor_player_id
      and sp.participation_type = 'free_agent'
      and sp.status = 'active'
  ) then
    raise exception 'Active free-agent registration is required before setting availability';
  end if;

  perform * from public.set_own_date_availability(
    actor_user_id,
    target_round.season_id,
    target_round.scheduled_on,
    availability_status
  );

  return query
  select
    target_round.season_id,
    target_round.id,
    actor_player_id,
    pda.status,
    pda.updated_at
  from private.player_date_availability pda
  where pda.season_id = target_round.season_id
    and pda.player_id = actor_player_id
    and pda.availability_date = target_round.scheduled_on;
end;
$$;

revoke all on function public.set_free_agent_availability(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_free_agent_availability(uuid, uuid, text)
  to service_role;

-- Captain lineup discovery keeps its existing RPC signature because the selected
-- round is still the captain's matchup context. Availability within that context
-- is now resolved from the round's actual scheduled calendar date.
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
  target_round public.rounds%rowtype;
  target_match public.team_matches%rowtype;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_round_id is null then raise exception 'target_round_id is required'; end if;

  select p.id into actor_player_id
  from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before viewing team availability'; end if;

  select r.* into target_round
  from public.rounds r
  join public.teams t on t.season_id = r.season_id
  where r.id = target_round_id
    and t.id = target_team_id
    and r.stage = 'regular';
  if not found then raise exception 'Regular-season round not found for team season'; end if;
  if target_round.scheduled_on is null then raise exception 'Round does not have a scheduled date'; end if;

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
    where slot.season_id = target_round.season_id
      and slot.player_id is not null
      and r.stage = 'regular'
    group by slot.player_id
  ),
  candidates as (
    -- Full own roster. Missing date response is explicitly Unsure.
    select
      0 as sort_order,
      membership.season_id,
      target_round_id as round_id,
      membership.team_id,
      p.id as player_id,
      p.display_name,
      membership.role,
      'roster'::text as participation_type,
      rating.fargo_rating,
      rating.rating_status,
      coalesce(availability.status, 'unsure'::text) as availability_status,
      availability.updated_at
    from public.team_memberships membership
    join public.players p on p.id = membership.player_id
    left join public.player_ratings rating on rating.player_id = membership.player_id
    left join private.player_date_availability availability
      on availability.season_id = target_round.season_id
     and availability.player_id = membership.player_id
     and availability.availability_date = target_round.scheduled_on
    where membership.team_id = target_team_id
      and membership.season_id = target_round.season_id
      and membership.ends_at is null

    union all

    -- Any active season player outside this roster may substitute when that player
    -- explicitly marked the selected calendar date Available. Team membership is
    -- not required, and membership on another team does not hide the player.
    select
      1 as sort_order,
      sp.season_id,
      target_round_id,
      target_team_id,
      p.id,
      p.display_name,
      null::text,
      'substitute'::text,
      rating.fargo_rating,
      rating.rating_status,
      availability.status,
      availability.updated_at
    from public.season_players sp
    join public.players p on p.id = sp.player_id
    join private.player_date_availability availability
      on availability.season_id = sp.season_id
     and availability.player_id = sp.player_id
     and availability.availability_date = target_round.scheduled_on
     and availability.status = 'available'
    left join public.player_ratings rating on rating.player_id = p.id
    where sp.season_id = target_round.season_id
      and sp.status = 'active'
      and not exists (
        select 1 from public.team_memberships own_membership
        where own_membership.season_id = target_round.season_id
          and own_membership.team_id = target_team_id
          and own_membership.player_id = p.id
          and own_membership.ends_at is null
      )
  ),
  choice_state as (
    select
      candidate.*,
      exists (
        select 1 from public.team_memberships member_a
        where member_a.season_id = target_round.season_id
          and member_a.team_id = target_match.team_a_id
          and member_a.player_id = candidate.player_id
          and member_a.ends_at is null
      ) and exists (
        select 1 from public.team_memberships member_b
        where member_b.season_id = target_round.season_id
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
    state.season_id,
    state.round_id,
    state.team_id,
    state.player_id,
    state.display_name,
    state.role,
    state.participation_type,
    state.fargo_rating,
    state.rating_status,
    state.availability_status,
    state.updated_at,
    coalesce(payment.status, 'unpaid') as payment_status,
    coalesce(scheduled.match_count, 0) as regular_matches_scheduled,
    (
      coalesce(payment.status, 'unpaid') in ('paid', 'waived')
      and coalesce(scheduled.match_count, 0) < 7
      and not state.already_opponent
      and (not state.needs_choice or state.selected_team_id = target_team_id)
    ) as eligible,
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
    end as eligibility_reason
  from choice_state state
  left join private.payment_status payment
    on payment.season_id = target_round.season_id
   and payment.player_id = state.player_id
  left join scheduled_counts scheduled on scheduled.player_id = state.player_id
  order by
    state.sort_order,
    case state.availability_status
      when 'available' then 0 when 'unsure' then 1 when 'unavailable' then 2 else 1 end,
    lower(state.display_name),
    state.player_id;
end;
$$;

revoke all on function public.list_team_round_availability(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.list_team_round_availability(uuid, uuid, uuid)
  to service_role;

comment on function public.list_team_round_availability(uuid, uuid, uuid) is
  'Captain-only lineup candidate read model. The round selects the matchup; player availability is authoritative by the round scheduled calendar date.';
comment on function public.set_roster_availability(uuid, uuid, text) is
  'Legacy round-shaped compatibility setter that delegates to player/date availability.';
comment on function public.set_free_agent_availability(uuid, uuid, text) is
  'Legacy round-shaped compatibility setter that delegates to player/date availability.';
