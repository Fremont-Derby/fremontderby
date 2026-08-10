create table private.player_match_score_submissions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_match_id uuid not null references public.player_matches(id) on delete cascade,
  tracker_player_id uuid not null references public.players(id) on delete cascade,
  racks jsonb not null default '[]'::jsonb check (jsonb_typeof(racks) = 'array'),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_match_id, tracker_player_id)
);

revoke all on private.player_match_score_submissions from public, anon, authenticated;
grant all on private.player_match_score_submissions to service_role;

create index player_match_score_submissions_match_idx
  on private.player_match_score_submissions(player_match_id);

create or replace function private.match_player_for_user(
  actor_user_id uuid,
  target_match public.player_matches
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.players p
  where p.user_id = actor_user_id
    and p.id in (target_match.player_a_id, target_match.player_b_id)
  limit 1;
$$;

revoke all on function private.match_player_for_user(uuid, public.player_matches) from public;

create or replace function public.record_player_match_score_rack(
  actor_user_id uuid,
  target_player_match_id uuid,
  rack_winner_side text
)
returns table(
  player_match_id uuid,
  tracker_player_id uuid,
  rack_number integer,
  discipline text,
  winner_side text,
  score_a integer,
  score_b integer,
  record_complete boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  existing_submission private.player_match_score_submissions%rowtype;
  next_rack_number integer;
  rack_discipline text;
  next_racks jsonb;
  next_score_a integer;
  next_score_b integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  if rack_winner_side not in ('A', 'B') then raise exception 'rack_winner_side must be A or B'; end if;

  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;
  if target_match.race_to_a is null or target_match.race_to_b is null then raise exception 'Race targets are required before recording racks'; end if;

  tracker_id := private.match_player_for_user(actor_user_id, target_match);
  if tracker_id is null then raise exception 'Only match players can submit independent score records'; end if;

  select * into existing_submission
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = tracker_id
  for update;

  if not found then
    existing_submission.racks := '[]'::jsonb;
  end if;

  select
    count(*) filter (where elem->>'winnerSide' = 'A')::integer,
    count(*) filter (where elem->>'winnerSide' = 'B')::integer
  into next_score_a, next_score_b
  from jsonb_array_elements(existing_submission.racks) elem;

  if next_score_a >= target_match.race_to_a or next_score_b >= target_match.race_to_b then
    raise exception 'Score record is already complete';
  end if;

  next_rack_number := jsonb_array_length(existing_submission.racks) + 1;
  rack_discipline := case
    when next_rack_number <= target_match.opening_block_length then target_match.opening_discipline
    when target_match.opening_discipline = '8-ball' then '9-ball'
    else '8-ball'
  end;

  next_racks := existing_submission.racks || jsonb_build_array(jsonb_build_object(
    'rackNumber', next_rack_number,
    'discipline', rack_discipline,
    'winnerSide', rack_winner_side
  ));

  select
    count(*) filter (where elem->>'winnerSide' = 'A')::integer,
    count(*) filter (where elem->>'winnerSide' = 'B')::integer
  into next_score_a, next_score_b
  from jsonb_array_elements(next_racks) elem;

  insert into private.player_match_score_submissions(
    season_id, player_match_id, tracker_player_id, racks, confirmed_at, updated_at
  ) values (
    target_match.season_id, target_player_match_id, tracker_id, next_racks, null, now()
  )
  on conflict (player_match_id, tracker_player_id)
  do update set racks = excluded.racks, confirmed_at = null, updated_at = now();

  return query select
    target_player_match_id,
    tracker_id,
    next_rack_number,
    rack_discipline,
    rack_winner_side,
    next_score_a,
    next_score_b,
    (next_score_a >= target_match.race_to_a or next_score_b >= target_match.race_to_b);
end;
$$;

revoke all on function public.record_player_match_score_rack(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.record_player_match_score_rack(uuid, uuid, text) to service_role;

create or replace function public.undo_player_match_score_rack(
  actor_user_id uuid,
  target_player_match_id uuid
)
returns table(
  player_match_id uuid,
  tracker_player_id uuid,
  undone_rack_number integer,
  score_a integer,
  score_b integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  submission private.player_match_score_submissions%rowtype;
  rack_count integer;
  next_racks jsonb;
  next_score_a integer;
  next_score_b integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;

  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;

  tracker_id := private.match_player_for_user(actor_user_id, target_match);
  if tracker_id is null then raise exception 'Only match players can edit independent score records'; end if;

  select * into submission
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = tracker_id
  for update;
  if not found or jsonb_array_length(submission.racks) = 0 then
    raise exception 'Score record has no racks to undo';
  end if;

  rack_count := jsonb_array_length(submission.racks);
  next_racks := submission.racks - (rack_count - 1);

  select
    count(*) filter (where elem->>'winnerSide' = 'A')::integer,
    count(*) filter (where elem->>'winnerSide' = 'B')::integer
  into next_score_a, next_score_b
  from jsonb_array_elements(next_racks) elem;

  update private.player_match_score_submissions
  set racks = next_racks, confirmed_at = null, updated_at = now()
  where id = submission.id;

  return query select target_player_match_id, tracker_id, rack_count, next_score_a, next_score_b;
end;
$$;

revoke all on function public.undo_player_match_score_rack(uuid, uuid) from public, anon, authenticated;
grant execute on function public.undo_player_match_score_rack(uuid, uuid) to service_role;

create or replace function public.confirm_player_match_score(
  actor_user_id uuid,
  target_player_match_id uuid
)
returns table(
  player_match_id uuid,
  tracker_player_id uuid,
  confirmed_at timestamptz,
  histories_match boolean,
  both_confirmed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  submission private.player_match_score_submissions%rowtype;
  opponent_submission private.player_match_score_submissions%rowtype;
  next_score_a integer;
  next_score_b integer;
  confirmed_time timestamptz;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;

  select * into target_match
  from public.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;

  tracker_id := private.match_player_for_user(actor_user_id, target_match);
  if tracker_id is null then raise exception 'Only match players can confirm independent score records'; end if;

  select * into submission
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = tracker_id
  for update;
  if not found or jsonb_array_length(submission.racks) = 0 then
    raise exception 'Score record is empty';
  end if;

  select
    count(*) filter (where elem->>'winnerSide' = 'A')::integer,
    count(*) filter (where elem->>'winnerSide' = 'B')::integer
  into next_score_a, next_score_b
  from jsonb_array_elements(submission.racks) elem;

  if next_score_a < target_match.race_to_a and next_score_b < target_match.race_to_b then
    raise exception 'Race target must be reached before confirmation';
  end if;

  confirmed_time := now();
  update private.player_match_score_submissions
  set confirmed_at = confirmed_time, updated_at = confirmed_time
  where id = submission.id
  returning * into submission;

  select * into opponent_submission
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id <> tracker_id
  limit 1;

  return query select
    target_player_match_id,
    tracker_id,
    confirmed_time,
    (opponent_submission.id is not null and opponent_submission.racks = submission.racks),
    (opponent_submission.confirmed_at is not null and submission.confirmed_at is not null);
end;
$$;

revoke all on function public.confirm_player_match_score(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_player_match_score(uuid, uuid) to service_role;

create or replace function public.get_player_match_score_comparison(
  actor_user_id uuid,
  target_player_match_id uuid
)
returns table(
  player_match_id uuid,
  tracker_player_id uuid,
  opponent_player_id uuid,
  own_racks jsonb,
  opponent_racks jsonb,
  own_confirmed_at timestamptz,
  opponent_confirmed_at timestamptz,
  histories_match boolean,
  mismatch_rack_number integer,
  both_confirmed boolean,
  ready_to_finalize boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.player_matches%rowtype;
  tracker_id uuid;
  opponent_id uuid;
  own_submission private.player_match_score_submissions%rowtype;
  opponent_submission private.player_match_score_submissions%rowtype;
  own_history jsonb;
  opponent_history jsonb;
  mismatch_number integer;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;

  select * into target_match from public.player_matches pm where pm.id = target_player_match_id;
  if not found then raise exception 'Player match not found'; end if;

  tracker_id := private.match_player_for_user(actor_user_id, target_match);
  if tracker_id is null then raise exception 'Only match players can compare independent score records'; end if;
  opponent_id := case when tracker_id = target_match.player_a_id then target_match.player_b_id else target_match.player_a_id end;

  select * into own_submission
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id and s.tracker_player_id = tracker_id;
  select * into opponent_submission
  from private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id and s.tracker_player_id = opponent_id;

  own_history := coalesce(own_submission.racks, '[]'::jsonb);
  opponent_history := coalesce(opponent_submission.racks, '[]'::jsonb);

  select gs + 1 into mismatch_number
  from generate_series(0, greatest(jsonb_array_length(own_history), jsonb_array_length(opponent_history)) - 1) gs
  where (own_history -> gs) is distinct from (opponent_history -> gs)
  order by gs
  limit 1;

  return query select
    target_player_match_id,
    tracker_id,
    opponent_id,
    own_history,
    opponent_history,
    own_submission.confirmed_at,
    opponent_submission.confirmed_at,
    (own_history = opponent_history and jsonb_array_length(own_history) > 0),
    mismatch_number,
    (own_submission.confirmed_at is not null and opponent_submission.confirmed_at is not null),
    (own_history = opponent_history and jsonb_array_length(own_history) > 0 and own_submission.confirmed_at is not null and opponent_submission.confirmed_at is not null);
end;
$$;

revoke all on function public.get_player_match_score_comparison(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_player_match_score_comparison(uuid, uuid) to service_role;

comment on table private.player_match_score_submissions is
  'Independent per-player rack histories used to reconcile a match before trusted finalization.';
comment on function public.record_player_match_score_rack(uuid, uuid, text) is
  'Service-role-only boundary for a match player to append one rack to their own independent score history.';
comment on function public.undo_player_match_score_rack(uuid, uuid) is
  'Service-role-only boundary for a match player to undo only the latest rack in their own unfinalized score history.';
comment on function public.confirm_player_match_score(uuid, uuid) is
  'Service-role-only boundary for a match player to confirm their completed independent score history.';
comment on function public.get_player_match_score_comparison(uuid, uuid) is
  'Service-role-only comparison of both players independent score histories, confirmation state, and first mismatch.';
