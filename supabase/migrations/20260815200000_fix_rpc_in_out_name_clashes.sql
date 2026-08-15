-- Fixed RPCs: avoid IN/OUT parameter name collisions (Postgres 42P13)

drop function if exists public.set_team_practice(uuid, uuid, text, text);
drop function if exists public.set_team_practice(uuid, uuid, text, text, text, date);

alter table public.teams
  add column if not exists practice_location text,
  add column if not exists practice_schedule text,
  add column if not exists practice_recurrence text,
  add column if not exists practice_on date;

alter table public.teams drop constraint if exists teams_practice_recurrence_check;
alter table public.teams
  add constraint teams_practice_recurrence_check
  check (practice_recurrence is null or practice_recurrence in ('weekly', 'once'));

create or replace function public.set_team_practice(
  actor_user_id uuid,
  target_team_id uuid,
  arg_practice_location text default null,
  arg_practice_schedule text default null,
  arg_practice_recurrence text default null,
  arg_practice_on date default null
)
returns table (
  team_id uuid,
  team_name text,
  practice_location text,
  practice_schedule text,
  practice_recurrence text,
  practice_on date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  cleaned_location text := nullif(btrim(coalesce(arg_practice_location, '')), '');
  cleaned_schedule text := nullif(btrim(coalesce(arg_practice_schedule, '')), '');
  cleaned_recurrence text := nullif(lower(btrim(coalesce(arg_practice_recurrence, ''))), '');
  cleaned_on date := arg_practice_on;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if cleaned_location is not null and char_length(cleaned_location) > 120 then
    raise exception 'practice_location must be 120 characters or fewer';
  end if;
  if cleaned_schedule is not null and char_length(cleaned_schedule) > 120 then
    raise exception 'practice_schedule must be 120 characters or fewer';
  end if;
  if cleaned_recurrence is not null and cleaned_recurrence not in ('weekly', 'once') then
    raise exception 'practice_recurrence must be weekly or once';
  end if;
  if cleaned_recurrence = 'once' and cleaned_on is null then
    raise exception 'practice_on is required for a one-off practice';
  end if;
  if cleaned_recurrence is distinct from 'once' then
    cleaned_on := null;
  end if;
  if cleaned_location is null and cleaned_schedule is null and cleaned_recurrence is null then
    cleaned_on := null;
  end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id limit 1;
  if actor_player_id is null then raise exception 'Player profile is required'; end if;

  if not exists (
    select 1 from public.team_memberships tm
    where tm.team_id = target_team_id and tm.player_id = actor_player_id
      and tm.role = 'captain' and tm.ends_at is null
  ) then
    raise exception 'Only the active team captain can set practice details';
  end if;

  update public.teams t
  set practice_location = cleaned_location,
      practice_schedule = cleaned_schedule,
      practice_recurrence = cleaned_recurrence,
      practice_on = cleaned_on
  where t.id = target_team_id;

  if not found then raise exception 'Team not found'; end if;

  return query
  select t.id, t.name, t.practice_location, t.practice_schedule, t.practice_recurrence, t.practice_on
  from public.teams t where t.id = target_team_id;
end;
$$;

revoke all on function public.set_team_practice(uuid, uuid, text, text, text, date) from public, anon, authenticated;
grant execute on function public.set_team_practice(uuid, uuid, text, text, text, date) to service_role;

-- Makeup columns + functions
alter table public.team_matches
  add column if not exists makeup_on date,
  add column if not exists makeup_location text,
  add column if not exists makeup_status text,
  add column if not exists makeup_note text,
  add column if not exists makeup_proposed_by_team_id uuid;

drop function if exists public.propose_team_match_makeup(uuid, uuid, date, text, text);
drop function if exists public.respond_team_match_makeup(uuid, uuid, text);

create or replace function public.propose_team_match_makeup(
  actor_user_id uuid,
  target_team_match_id uuid,
  arg_makeup_on date,
  arg_makeup_location text default null,
  arg_makeup_note text default null
)
returns table (
  team_match_id uuid,
  makeup_on date,
  makeup_location text,
  makeup_status text,
  makeup_note text,
  makeup_proposed_by_team_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  actor_team_id uuid;
  cleaned_location text := nullif(btrim(coalesce(arg_makeup_location, '')), '');
  cleaned_note text := nullif(btrim(coalesce(arg_makeup_note, '')), '');
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_match_id is null then raise exception 'target_team_match_id is required'; end if;
  if arg_makeup_on is null then raise exception 'makeup_on is required'; end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id limit 1;
  if actor_player_id is null then raise exception 'Player profile is required'; end if;

  select tm.team_id into actor_team_id
  from public.team_matches match
  join public.team_memberships tm on tm.player_id = actor_player_id
    and tm.role = 'captain' and tm.ends_at is null
    and tm.team_id in (match.team_a_id, match.team_b_id)
  where match.id = target_team_match_id
  limit 1;

  if actor_team_id is null then raise exception 'Only a match captain can propose a makeup'; end if;

  update public.team_matches tm
  set makeup_on = arg_makeup_on,
      makeup_location = cleaned_location,
      makeup_note = cleaned_note,
      makeup_status = 'proposed',
      makeup_proposed_by_team_id = actor_team_id
  where tm.id = target_team_match_id;

  return query
  select tm.id, tm.makeup_on, tm.makeup_location, tm.makeup_status, tm.makeup_note, tm.makeup_proposed_by_team_id
  from public.team_matches tm where tm.id = target_team_match_id;
end;
$$;

create or replace function public.respond_team_match_makeup(
  actor_user_id uuid,
  target_team_match_id uuid,
  arg_response text
)
returns table (
  team_match_id uuid,
  makeup_on date,
  makeup_location text,
  makeup_status text,
  makeup_note text,
  makeup_proposed_by_team_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  actor_team_id uuid;
  cleaned text := lower(btrim(coalesce(arg_response, '')));
  proposed_by uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_match_id is null then raise exception 'target_team_match_id is required'; end if;
  if cleaned not in ('accepted', 'declined', 'cancelled') then
    raise exception 'response must be accepted, declined, or cancelled';
  end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id limit 1;
  if actor_player_id is null then raise exception 'Player profile is required'; end if;

  select tm.makeup_proposed_by_team_id into proposed_by
  from public.team_matches tm where tm.id = target_team_match_id;

  select tm.team_id into actor_team_id
  from public.team_matches match
  join public.team_memberships tm on tm.player_id = actor_player_id
    and tm.role = 'captain' and tm.ends_at is null
    and tm.team_id in (match.team_a_id, match.team_b_id)
  where match.id = target_team_match_id
  limit 1;

  if actor_team_id is null then raise exception 'Only a match captain can respond to a makeup'; end if;

  if cleaned = 'cancelled' then
    if proposed_by is distinct from actor_team_id then
      raise exception 'Only the proposing team can cancel a makeup';
    end if;
  elsif proposed_by is not distinct from actor_team_id then
    raise exception 'The opposing captain must accept or decline the makeup';
  end if;

  update public.team_matches tm
  set makeup_status = cleaned,
      makeup_on = case when cleaned = 'cancelled' then null else tm.makeup_on end
  where tm.id = target_team_match_id;

  return query
  select tm.id, tm.makeup_on, tm.makeup_location, tm.makeup_status, tm.makeup_note, tm.makeup_proposed_by_team_id
  from public.team_matches tm where tm.id = target_team_match_id;
end;
$$;

revoke all on function public.propose_team_match_makeup(uuid, uuid, date, text, text) from public, anon, authenticated;
grant execute on function public.propose_team_match_makeup(uuid, uuid, date, text, text) to service_role;
revoke all on function public.respond_team_match_makeup(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.respond_team_match_makeup(uuid, uuid, text) to service_role;

-- Audit list: rename OUT actor_user_id collision
drop function if exists public.list_admin_audit_events(uuid, integer, text);

create or replace function public.list_admin_audit_events(
  actor_user_id uuid,
  result_limit integer default 50,
  action_prefix text default null
)
returns table (
  id uuid,
  event_actor_user_id uuid,
  actor_display_name text,
  action text,
  entity_type text,
  entity_id uuid,
  reason text,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cleaned_prefix text := nullif(btrim(coalesce(action_prefix, '')), '');
  lim integer := greatest(1, least(coalesce(result_limit, 50), 200));
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists (select 1 from private.league_admins la where la.user_id = actor_user_id) then
    raise exception 'League admin access is required';
  end if;

  return query
  select
    e.id,
    e.actor_user_id,
    coalesce(p.display_name, left(e.actor_user_id::text, 8)),
    e.action,
    e.entity_type,
    e.entity_id,
    e.reason,
    e.before_state,
    e.after_state,
    e.created_at
  from private.audit_events e
  left join public.players p on p.user_id = e.actor_user_id
  where cleaned_prefix is null or e.action like cleaned_prefix || '%'
  order by e.created_at desc
  limit lim;
end;
$$;

revoke all on function public.list_admin_audit_events(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.list_admin_audit_events(uuid, integer, text) to service_role;
