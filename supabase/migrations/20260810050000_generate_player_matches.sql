create table public.player_matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_id uuid not null,
  team_match_id uuid not null references public.team_matches(id) on delete cascade,
  slot_number integer not null check (slot_number between 1 and 4),
  team_a_id uuid not null,
  team_b_id uuid not null,
  player_a_id uuid not null references public.players(id) on delete restrict,
  player_b_id uuid not null references public.players(id) on delete restrict,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'finalized', 'corrected')),
  winner_player_id uuid references public.players(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (round_id, season_id)
    references public.rounds(id, season_id)
    on delete cascade,
  foreign key (team_a_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  foreign key (team_b_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  check (team_a_id <> team_b_id),
  check (player_a_id <> player_b_id),
  unique (team_match_id, slot_number)
);

create table public.team_match_forfeits (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  round_id uuid not null,
  team_match_id uuid not null references public.team_matches(id) on delete cascade,
  slot_number integer not null check (slot_number between 1 and 4),
  forfeiting_team_id uuid not null,
  credited_team_id uuid,
  reason text not null default 'empty_lineup_slot'
    check (reason in ('empty_lineup_slot')),
  created_at timestamptz not null default now(),
  foreign key (round_id, season_id)
    references public.rounds(id, season_id)
    on delete cascade,
  foreign key (forfeiting_team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  foreign key (credited_team_id, season_id)
    references public.teams(id, season_id)
    on delete cascade,
  check (credited_team_id is null or credited_team_id <> forfeiting_team_id),
  unique (team_match_id, slot_number, forfeiting_team_id)
);

alter table public.player_matches enable row level security;
alter table public.team_match_forfeits enable row level security;

grant select on public.player_matches, public.team_match_forfeits to anon, authenticated;
grant all on public.player_matches, public.team_match_forfeits to service_role;

create policy "Player matches are publicly readable"
on public.player_matches for select
to anon, authenticated
using (true);

create policy "Team match forfeits are publicly readable"
on public.team_match_forfeits for select
to anon, authenticated
using (true);

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

  if team_a_slot_count <> 4 or team_b_slot_count <> 4 then
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

create or replace function private.refresh_generated_team_match_results_from_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_lineup_id uuid;
  changed_team_match_id uuid;
begin
  changed_lineup_id := coalesce(new.lineup_id, old.lineup_id);

  select tl.team_match_id
    into changed_team_match_id
  from private.team_lineups tl
  where tl.id = changed_lineup_id;

  if changed_team_match_id is not null then
    perform private.rebuild_generated_team_match_results(changed_team_match_id);
  end if;

  return null;
end;
$$;

revoke all on function private.rebuild_generated_team_match_results(uuid)
  from public;
revoke all on function private.refresh_generated_team_match_results_from_slot()
  from public;

create trigger refresh_generated_team_match_results_after_slot_insert
after insert on private.team_lineup_slots
for each row execute function private.refresh_generated_team_match_results_from_slot();

create trigger refresh_generated_team_match_results_after_slot_update
after update on private.team_lineup_slots
for each row execute function private.refresh_generated_team_match_results_from_slot();

create trigger refresh_generated_team_match_results_after_slot_delete
after delete on private.team_lineup_slots
for each row execute function private.refresh_generated_team_match_results_from_slot();

comment on table public.player_matches is
  'Generated individual matches from opposing submitted lineup slots. Empty lineup slots never create player records.';

comment on table public.team_match_forfeits is
  'Generated team forfeits for empty lineup slots. These affect team results without creating individual losses.';

comment on function private.rebuild_generated_team_match_results(uuid) is
  'Rebuilds generated player matches and forfeits for a team match once both four-slot lineups exist.';
