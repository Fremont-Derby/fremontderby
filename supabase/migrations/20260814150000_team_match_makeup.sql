-- Captain-proposed makeup date/location for a scheduled team match.

alter table public.team_matches
  add column if not exists makeup_on date,
  add column if not exists makeup_location text,
  add column if not exists makeup_status text,
  add column if not exists makeup_note text,
  add column if not exists makeup_proposed_by_team_id uuid;

alter table public.team_matches
  drop constraint if exists team_matches_makeup_status_check;
alter table public.team_matches
  add constraint team_matches_makeup_status_check
  check (
    makeup_status is null
    or makeup_status in ('proposed', 'accepted', 'declined', 'cancelled')
  );

alter table public.team_matches
  drop constraint if exists team_matches_makeup_location_len;
alter table public.team_matches
  add constraint team_matches_makeup_location_len
  check (
    makeup_location is null
    or char_length(btrim(makeup_location)) between 1 and 120
  );

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
  match public.team_matches%rowtype;
  actor_team_id uuid;
  cleaned_location text := nullif(btrim(coalesce(arg_makeup_location, '')), '');
  cleaned_note text := nullif(btrim(coalesce(arg_makeup_note, '')), '');
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_match_id is null then raise exception 'target_team_match_id is required'; end if;
  if arg_makeup_on is null then raise exception 'makeup_on is required'; end if;
  if cleaned_location is not null and char_length(cleaned_location) > 120 then
    raise exception 'makeup_location must be 120 characters or fewer';
  end if;
  if cleaned_note is not null and char_length(cleaned_note) > 200 then
    raise exception 'makeup_note must be 200 characters or fewer';
  end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id limit 1;
  if actor_player_id is null then raise exception 'Player profile is required'; end if;

  select * into match from public.team_matches tm where tm.id = target_team_match_id for update;
  if not found then raise exception 'Match not found'; end if;
  if match.status in ('finalized', 'corrected') then
    raise exception 'Finalized matches cannot be rescheduled here';
  end if;

  select tm.team_id into actor_team_id
  from public.team_memberships tm
  where tm.player_id = actor_player_id
    and tm.role = 'captain'
    and tm.ends_at is null
    and tm.team_id in (match.team_a_id, match.team_b_id)
  limit 1;

  if actor_team_id is null then
    raise exception 'Only a match captain can propose a makeup';
  end if;

  update public.team_matches tm
  set
    makeup_on = arg_makeup_on,
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
  response text
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
  match public.team_matches%rowtype;
  actor_team_id uuid;
  cleaned text := lower(btrim(coalesce(response, '')));
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_match_id is null then raise exception 'target_team_match_id is required'; end if;
  if cleaned not in ('accepted', 'declined', 'cancelled') then
    raise exception 'response must be accepted, declined, or cancelled';
  end if;

  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id limit 1;
  if actor_player_id is null then raise exception 'Player profile is required'; end if;

  select * into match from public.team_matches tm where tm.id = target_team_match_id for update;
  if not found then raise exception 'Match not found'; end if;
  if match.makeup_status is distinct from 'proposed' and cleaned <> 'cancelled' then
    raise exception 'No makeup proposal is waiting for a response';
  end if;

  select tm.team_id into actor_team_id
  from public.team_memberships tm
  where tm.player_id = actor_player_id
    and tm.role = 'captain'
    and tm.ends_at is null
    and tm.team_id in (match.team_a_id, match.team_b_id)
  limit 1;

  if actor_team_id is null then
    raise exception 'Only a match captain can respond to a makeup';
  end if;

  if cleaned = 'cancelled' then
    if match.makeup_proposed_by_team_id is distinct from actor_team_id then
      raise exception 'Only the proposing captain can cancel a makeup proposal';
    end if;
  else
    if match.makeup_proposed_by_team_id = actor_team_id then
      raise exception 'The other team captain must accept or decline';
    end if;
  end if;

  if cleaned = 'cancelled' or cleaned = 'declined' then
    update public.team_matches tm
    set makeup_status = cleaned,
        makeup_on = case when cleaned = 'cancelled' then null else tm.makeup_on end,
        makeup_location = case when cleaned = 'cancelled' then null else tm.makeup_location end,
        makeup_note = case when cleaned = 'cancelled' then null else tm.makeup_note end,
        makeup_proposed_by_team_id = case when cleaned = 'cancelled' then null else tm.makeup_proposed_by_team_id end
    where tm.id = target_team_match_id;
  else
    update public.team_matches tm
    set makeup_status = 'accepted'
    where tm.id = target_team_match_id;
  end if;

  return query
  select tm.id, tm.makeup_on, tm.makeup_location, tm.makeup_status, tm.makeup_note, tm.makeup_proposed_by_team_id
  from public.team_matches tm where tm.id = target_team_match_id;
end;
$$;

revoke all on function public.propose_team_match_makeup(uuid, uuid, date, text, text) from public, anon, authenticated;
grant execute on function public.propose_team_match_makeup(uuid, uuid, date, text, text) to service_role;
revoke all on function public.respond_team_match_makeup(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.respond_team_match_makeup(uuid, uuid, text) to service_role;
