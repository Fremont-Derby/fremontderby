alter table public.player_matches
  add column if not exists opening_block_length integer not null default 3
    check (opening_block_length > 0),
  add column if not exists opening_discipline text not null default '8-ball'
    check (opening_discipline in ('8-ball', '9-ball')),
  add column if not exists current_discipline text not null default '8-ball'
    check (current_discipline in ('8-ball', '9-ball')),
  add column if not exists first_break text not null default 'A'
    check (first_break in ('A', 'B')),
  add column if not exists score_a integer not null default 0
    check (score_a >= 0),
  add column if not exists score_b integer not null default 0
    check (score_b >= 0),
  add column if not exists winner_side text
    check (winner_side in ('A', 'B'));

create table public.player_match_racks (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_match_id uuid not null references public.player_matches(id) on delete cascade,
  rack_number integer not null check (rack_number > 0),
  discipline text not null check (discipline in ('8-ball', '9-ball')),
  winner_side text not null check (winner_side in ('A', 'B')),
  winner_player_id uuid not null references public.players(id) on delete restrict,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  unique (player_match_id, rack_number)
);

alter table public.player_match_racks enable row level security;

grant select on public.player_match_racks to anon, authenticated;
grant all on public.player_match_racks to service_role;

create policy "Player match racks are publicly readable"
on public.player_match_racks for select
to anon, authenticated
using (true);

create or replace function private.can_score_player_match(
  actor_user_id uuid,
  target_match public.player_matches
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.players p
    where p.user_id = actor_user_id
      and p.id in (target_match.player_a_id, target_match.player_b_id)
  )
  or exists (
    select 1
    from public.players p
    join public.team_memberships tm
      on tm.player_id = p.id
    where p.user_id = actor_user_id
      and tm.season_id = target_match.season_id
      and tm.team_id in (target_match.team_a_id, target_match.team_b_id)
      and tm.role = 'captain'
      and tm.ends_at is null
  );
$$;

revoke all on function private.can_score_player_match(uuid, public.player_matches)
  from public;

create or replace function private.lock_player_match_ratings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rating_a public.player_ratings%rowtype;
  rating_b public.player_ratings%rowtype;
  rating_band public.season_race_chart_bands%rowtype;
  match_season public.seasons%rowtype;
begin
  select *
    into rating_a
  from public.player_ratings pr
  where pr.player_id = new.player_a_id;

  select *
    into rating_b
  from public.player_ratings pr
  where pr.player_id = new.player_b_id;

  select *
    into match_season
  from public.seasons s
  where s.id = new.season_id;

  new.player_a_fargo_rating := rating_a.fargo_rating;
  new.player_b_fargo_rating := rating_b.fargo_rating;
  new.player_a_rating_status := rating_a.rating_status;
  new.player_b_rating_status := rating_b.rating_status;
  new.opening_block_length := coalesce(match_season.opening_block_length, new.opening_block_length, 3);
  new.opening_discipline := coalesce(new.opening_discipline, '8-ball');
  new.current_discipline := coalesce(new.current_discipline, new.opening_discipline);
  new.first_break := coalesce(new.first_break, 'A');

  if rating_a.fargo_rating is not null and rating_b.fargo_rating is not null then
    select *
      into rating_band
    from public.season_race_chart_bands band
    where band.season_id = new.season_id
      and abs(rating_a.fargo_rating - rating_b.fargo_rating) <= band.max_rating_diff
    order by band.max_rating_diff asc
    limit 1;

    if found then
      if rating_a.fargo_rating = rating_b.fargo_rating then
        new.race_to_a := rating_band.stronger_race_to;
        new.race_to_b := rating_band.stronger_race_to;
      elsif rating_a.fargo_rating > rating_b.fargo_rating then
        new.race_to_a := rating_band.stronger_race_to;
        new.race_to_b := rating_band.weaker_race_to;
      else
        new.race_to_a := rating_band.weaker_race_to;
        new.race_to_b := rating_band.stronger_race_to;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.get_player_match_scorecard(
  actor_user_id uuid,
  target_player_match_id uuid
)
returns table (
  player_match_id uuid,
  season_id uuid,
  round_id uuid,
  team_match_id uuid,
  team_a_id uuid,
  team_b_id uuid,
  player_a_id uuid,
  player_a_display_name text,
  player_a_fargo_rating integer,
  player_a_rating_status text,
  player_b_id uuid,
  player_b_display_name text,
  player_b_fargo_rating integer,
  player_b_rating_status text,
  race_to_a integer,
  race_to_b integer,
  opening_block_length integer,
  opening_discipline text,
  current_discipline text,
  first_break text,
  score_a integer,
  score_b integer,
  winner_side text,
  winner_player_id uuid,
  status text,
  racks jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_player_match_id is null then
    raise exception 'target_player_match_id is required';
  end if;

  select *
    into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id;

  if not found then
    raise exception 'Player match not found';
  end if;

  if not private.can_score_player_match(actor_user_id, target_match) then
    raise exception 'Only match players or active team captains can view the scorecard';
  end if;

  return query
  select
    pm.id as player_match_id,
    pm.season_id,
    pm.round_id,
    pm.team_match_id,
    pm.team_a_id,
    pm.team_b_id,
    pm.player_a_id,
    player_a.display_name as player_a_display_name,
    pm.player_a_fargo_rating,
    pm.player_a_rating_status,
    pm.player_b_id,
    player_b.display_name as player_b_display_name,
    pm.player_b_fargo_rating,
    pm.player_b_rating_status,
    pm.race_to_a,
    pm.race_to_b,
    pm.opening_block_length,
    pm.opening_discipline,
    pm.current_discipline,
    pm.first_break,
    pm.score_a,
    pm.score_b,
    pm.winner_side,
    pm.winner_player_id,
    pm.status,
    coalesce(rack_rows.racks, '[]'::jsonb) as racks
  from public.player_matches pm
  join public.players player_a
    on player_a.id = pm.player_a_id
  join public.players player_b
    on player_b.id = pm.player_b_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'rackNumber', ordered_racks.rack_number,
        'discipline', ordered_racks.discipline,
        'winnerSide', ordered_racks.winner_side,
        'winnerPlayerId', ordered_racks.winner_player_id,
        'recordedAt', ordered_racks.recorded_at
      )
      order by ordered_racks.rack_number
    ) as racks
    from public.player_match_racks ordered_racks
    where ordered_racks.player_match_id = pm.id
  ) rack_rows on true
  where pm.id = target_player_match_id;
end;
$$;

create or replace function public.record_player_match_rack(
  actor_user_id uuid,
  target_player_match_id uuid,
  rack_winner_side text
)
returns table (
  player_match_id uuid,
  rack_number integer,
  discipline text,
  winner_side text,
  score_a integer,
  score_b integer,
  current_discipline text,
  match_winner_side text,
  winner_player_id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  next_rack_number integer;
  rack_discipline text;
  next_score_a integer;
  next_score_b integer;
  next_current_discipline text;
  next_winner_side text;
  next_winner_player_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_player_match_id is null then
    raise exception 'target_player_match_id is required';
  end if;

  if rack_winner_side not in ('A', 'B') then
    raise exception 'rack_winner_side must be A or B';
  end if;

  select *
    into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;

  if not found then
    raise exception 'Player match not found';
  end if;

  if target_match.status in ('finalized', 'corrected') then
    raise exception 'Player match is finalized';
  end if;

  if target_match.winner_side is not null then
    raise exception 'Player match is already complete';
  end if;

  if target_match.race_to_a is null or target_match.race_to_b is null then
    raise exception 'Race targets are required before recording racks';
  end if;

  if not private.can_score_player_match(actor_user_id, target_match) then
    raise exception 'Only match players or active team captains can record racks';
  end if;

  select coalesce(max(rack_number), 0) + 1
    into next_rack_number
  from public.player_match_racks pmr
  where pmr.player_match_id = target_player_match_id;

  rack_discipline := target_match.current_discipline;
  next_score_a := target_match.score_a + case when rack_winner_side = 'A' then 1 else 0 end;
  next_score_b := target_match.score_b + case when rack_winner_side = 'B' then 1 else 0 end;
  next_current_discipline := target_match.current_discipline;
  next_winner_side := null;
  next_winner_player_id := null;

  if next_score_a >= target_match.race_to_a then
    next_winner_side := 'A';
    next_winner_player_id := target_match.player_a_id;
  elsif next_score_b >= target_match.race_to_b then
    next_winner_side := 'B';
    next_winner_player_id := target_match.player_b_id;
  elsif next_rack_number = target_match.opening_block_length then
    next_current_discipline := case
      when target_match.opening_discipline = '8-ball' then '9-ball'
      else '8-ball'
    end;
  end if;

  insert into public.player_match_racks (
    season_id,
    player_match_id,
    rack_number,
    discipline,
    winner_side,
    winner_player_id,
    recorded_by
  ) values (
    target_match.season_id,
    target_player_match_id,
    next_rack_number,
    rack_discipline,
    rack_winner_side,
    case when rack_winner_side = 'A' then target_match.player_a_id else target_match.player_b_id end,
    actor_user_id
  );

  update public.player_matches
  set score_a = next_score_a,
      score_b = next_score_b,
      current_discipline = next_current_discipline,
      winner_side = next_winner_side,
      winner_player_id = next_winner_player_id,
      status = 'in_progress'
  where player_matches.id = target_player_match_id;

  return query
  select
    target_player_match_id,
    next_rack_number,
    rack_discipline,
    rack_winner_side,
    next_score_a,
    next_score_b,
    next_current_discipline,
    next_winner_side,
    next_winner_player_id,
    'in_progress'::text;
end;
$$;

revoke all on function public.get_player_match_scorecard(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_player_match_scorecard(uuid, uuid)
  to service_role;

revoke all on function public.record_player_match_rack(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_player_match_rack(uuid, uuid, text)
  to service_role;

comment on table public.player_match_racks is
  'Ordered rack history for a player match. Trusted scoring writes racks; public read models may show live progress.';

comment on function public.get_player_match_scorecard(uuid, uuid) is
  'Service-role-only scorecard read model for match participants and active team captains.';

comment on function public.record_player_match_rack(uuid, uuid, text) is
  'Service-role-only rack recording boundary that advances score, discipline, and winner state from locked race targets.';
