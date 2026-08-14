-- Practice recurrence (weekly vs one-off) + optional date for one-off sessions.

alter table public.teams
  add column if not exists practice_recurrence text,
  add column if not exists practice_on date;

alter table public.teams
  drop constraint if exists teams_practice_recurrence_check;
alter table public.teams
  add constraint teams_practice_recurrence_check
  check (
    practice_recurrence is null
    or practice_recurrence in ('weekly', 'once')
  );

comment on column public.teams.practice_recurrence is
  'weekly = recurring practice; once = single session; null = not set.';
comment on column public.teams.practice_on is
  'Calendar date for one-off practice sessions.';

create or replace function public.set_team_practice(
  actor_user_id uuid,
  target_team_id uuid,
  practice_location text default null,
  practice_schedule text default null,
  practice_recurrence text default null,
  practice_on date default null
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
  cleaned_location text := nullif(btrim(coalesce(practice_location, '')), '');
  cleaned_schedule text := nullif(btrim(coalesce(practice_schedule, '')), '');
  cleaned_recurrence text := nullif(lower(btrim(coalesce(practice_recurrence, ''))), '');
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
  if cleaned_recurrence is not null and cleaned_recurrence not in ('weekly', 'once') then
    raise exception 'practice_recurrence must be weekly or once';
  end if;
  if cleaned_recurrence = 'once' and practice_on is null then
    raise exception 'practice_on is required for a one-off practice';
  end if;
  if cleaned_recurrence is distinct from 'once' then
    practice_on := null;
  end if;
  -- Clearing all practice fields when nothing meaningful is provided
  if cleaned_location is null and cleaned_schedule is null and cleaned_recurrence is null then
    practice_on := null;
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
    practice_schedule = cleaned_schedule,
    practice_recurrence = cleaned_recurrence,
    practice_on = practice_on
  where t.id = target_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  return query
  select
    t.id,
    t.name,
    t.practice_location,
    t.practice_schedule,
    t.practice_recurrence,
    t.practice_on
  from public.teams t
  where t.id = target_team_id;
end;
$$;

revoke all on function public.set_team_practice(uuid, uuid, text, text, text, date)
  from public, anon, authenticated;
grant execute on function public.set_team_practice(uuid, uuid, text, text, text, date)
  to service_role;

-- Drop old 4-arg overload if present so callers use the expanded signature.
drop function if exists public.set_team_practice(uuid, uuid, text, text);

comment on function public.set_team_practice(uuid, uuid, text, text, text, date) is
  'Active captain sets or clears team practice location, schedule, weekly/once recurrence, and one-off date.';
