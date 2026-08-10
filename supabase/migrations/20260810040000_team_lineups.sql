alter table public.rounds
  add column if not exists lineup_deadline_at timestamptz;

create table private.team_lineups (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_id uuid not null,
  team_match_id uuid not null references public.team_matches(id) on delete cascade,
  team_id uuid not null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (round_id, season_id)
    references public.rounds(id, season_id)
    on delete cascade,
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  unique (team_match_id, team_id)
);

create table private.team_lineup_slots (
  lineup_id uuid not null references private.team_lineups(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_id uuid not null,
  team_id uuid not null,
  slot_number integer not null check (slot_number between 1 and 4),
  player_id uuid references public.players(id) on delete restrict,
  participation_type text not null
    check (participation_type in ('roster', 'free_agent', 'forfeit')),
  created_at timestamptz not null default now(),
  primary key (lineup_id, slot_number),
  check (
    (participation_type = 'forfeit' and player_id is null)
    or (participation_type in ('roster', 'free_agent') and player_id is not null)
  ),
  foreign key (round_id, season_id)
    references public.rounds(id, season_id)
    on delete cascade,
  foreign key (team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade
);

create unique index one_lineup_player_per_round
  on private.team_lineup_slots (round_id, player_id)
  where player_id is not null;

create unique index one_lineup_slot_per_team_round
  on private.team_lineup_slots (round_id, team_id, slot_number);

revoke all on table private.team_lineups from public, anon, authenticated;
revoke all on table private.team_lineup_slots from public, anon, authenticated;
grant all on table private.team_lineups, private.team_lineup_slots to service_role;

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

  if jsonb_array_length(lineup_slots) > 4 then
    raise exception 'Lineup cannot contain more than four slots';
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
       or parsed_slots.slot_number > 4
  ) then
    raise exception 'Lineup slot numbers must be between 1 and 4';
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
  from generate_series(1, 4) as slot_numbers(slot_number)
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

comment on column public.rounds.lineup_deadline_at is
  'Optional trusted deadline after which captain lineup submission is rejected.';

comment on table private.team_lineups is
  'Private submitted team lineups. Opponents see lineup data only through trusted views once reveal rules allow it.';

comment on table private.team_lineup_slots is
  'Private four-slot lineup entries. Blank slots are explicit forfeits and never create fake individual player records.';

comment on function public.submit_team_lineup(uuid, uuid, uuid, jsonb) is
  'Service-role-only captain boundary for submitting up to four roster or eligible free-agent lineup slots.';
