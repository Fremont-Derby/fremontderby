-- Captain-set practice location and schedule for a team.

alter table public.teams
  add column if not exists practice_location text,
  add column if not exists practice_schedule text;

alter table public.teams
  drop constraint if exists teams_practice_location_len;
alter table public.teams
  add constraint teams_practice_location_len
  check (
    practice_location is null
    or char_length(btrim(practice_location)) between 1 and 120
  );

alter table public.teams
  drop constraint if exists teams_practice_schedule_len;
alter table public.teams
  add constraint teams_practice_schedule_len
  check (
    practice_schedule is null
    or char_length(btrim(practice_schedule)) between 1 and 120
  );

comment on column public.teams.practice_location is
  'Optional practice venue or place text set by the team captain.';
comment on column public.teams.practice_schedule is
  'Optional practice time/cadence text set by the team captain (e.g. Thu 7pm).';

create or replace function public.set_team_practice(
  actor_user_id uuid,
  target_team_id uuid,
  practice_location text default null,
  practice_schedule text default null
)
returns table (
  team_id uuid,
  team_name text,
  practice_location text,
  practice_schedule text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  cleaned_location text := nullif(btrim(coalesce(practice_location, '')), '');
  cleaned_schedule text := nullif(btrim(coalesce(practice_schedule, '')), '');
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  if target_team_id is null then
    raise exception 'target_team_id is required';
  end if;
  if cleaned_location is not null and char_length(cleaned_location) > 120 then
    raise exception 'practice_location must be 120 characters or fewer';
  end if;
  if cleaned_schedule is not null and char_length(cleaned_schedule) > 120 then
    raise exception 'practice_schedule must be 120 characters or fewer';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id
  limit 1;

  if actor_player_id is null then
    raise exception 'Player profile is required';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only the active team captain can set practice details';
  end if;

  update public.teams t
  set
    practice_location = cleaned_location,
    practice_schedule = cleaned_schedule
  where t.id = target_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  return query
  select t.id, t.name, t.practice_location, t.practice_schedule
  from public.teams t
  where t.id = target_team_id;
end;
$$;

revoke all on function public.set_team_practice(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.set_team_practice(uuid, uuid, text, text)
  to service_role;

comment on function public.set_team_practice(uuid, uuid, text, text) is
  'Active captain sets or clears team practice location and schedule text.';
