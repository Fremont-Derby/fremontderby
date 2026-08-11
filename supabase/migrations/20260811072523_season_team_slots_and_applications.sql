alter table public.seasons
  add column if not exists team_capacity integer not null default 8,
  add column if not exists minimum_committed_roster integer not null default 3,
  add column if not exists returning_reservation_deadline timestamptz,
  add column if not exists conditional_hold_days integer not null default 14;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'seasons_team_capacity_check'
      and conrelid = 'public.seasons'::regclass
  ) then
    alter table public.seasons
      add constraint seasons_team_capacity_check
      check (team_capacity between 2 and 32);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'seasons_minimum_committed_roster_check'
      and conrelid = 'public.seasons'::regclass
  ) then
    alter table public.seasons
      add constraint seasons_minimum_committed_roster_check
      check (minimum_committed_roster between 1 and 20);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'seasons_conditional_hold_days_check'
      and conrelid = 'public.seasons'::regclass
  ) then
    alter table public.seasons
      add constraint seasons_conditional_hold_days_check
      check (conditional_hold_days between 1 and 90);
  end if;
end $$;

create table if not exists private.season_team_slots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  source_team_id uuid references public.teams(id) on delete restrict,
  team_id uuid references public.teams(id) on delete restrict,
  returning_captain_player_id uuid references public.players(id) on delete set null,
  assigned_captain_player_id uuid references public.players(id) on delete set null,
  status text not null,
  reservation_expires_at timestamptz,
  hold_expires_at timestamptz,
  last_action_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint season_team_slots_status_check check (
    status in (
      'reserved',
      'transferred',
      'approved_pending_roster',
      'ready',
      'confirmed',
      'released',
      'expired'
    )
  ),
  constraint season_team_slots_source_or_team_check check (
    source_team_id is not null or team_id is not null
  )
);

create table if not exists private.team_applications (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  applicant_player_id uuid not null references public.players(id) on delete cascade,
  proposed_team_name text not null,
  status text not null default 'applied',
  team_id uuid references public.teams(id) on delete set null,
  slot_id uuid references private.season_team_slots(id) on delete set null,
  admin_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint team_applications_name_check check (
    char_length(btrim(proposed_team_name)) between 1 and 80
  ),
  constraint team_applications_status_check check (
    status in (
      'applied',
      'deferred',
      'approved_pending_roster',
      'ready',
      'confirmed',
      'rejected',
      'withdrawn',
      'expired'
    )
  )
);

create unique index if not exists season_team_slots_source_team_unique
  on private.season_team_slots(season_id, source_team_id)
  where source_team_id is not null;

create unique index if not exists season_team_slots_team_unique
  on private.season_team_slots(season_id, team_id)
  where team_id is not null;

create index if not exists season_team_slots_capacity_idx
  on private.season_team_slots(season_id, status);

create index if not exists season_team_slots_assigned_captain_idx
  on private.season_team_slots(assigned_captain_player_id, season_id)
  where status in ('reserved', 'transferred');

create unique index if not exists team_applications_active_captain_unique
  on private.team_applications(season_id, applicant_player_id)
  where status in ('applied', 'deferred', 'approved_pending_roster', 'ready', 'confirmed');

create unique index if not exists team_applications_active_name_unique
  on private.team_applications(season_id, lower(btrim(proposed_team_name)))
  where status in ('applied', 'deferred', 'approved_pending_roster', 'ready', 'confirmed');

create index if not exists team_applications_review_queue_idx
  on private.team_applications(season_id, status, submitted_at);

alter table private.season_team_slots enable row level security;
alter table private.team_applications enable row level security;

revoke all on private.season_team_slots from public, anon, authenticated;
revoke all on private.team_applications from public, anon, authenticated;
grant select, insert, update, delete on private.season_team_slots to service_role;
grant select, insert, update, delete on private.team_applications to service_role;

create or replace function private.expire_season_team_registration(target_season_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.season_team_slots sts
  set status = 'expired',
      resolved_at = now(),
      updated_at = now(),
      last_action_reason = coalesce(sts.last_action_reason, 'Reservation deadline passed')
  where sts.season_id = target_season_id
    and sts.status in ('reserved', 'transferred')
    and sts.reservation_expires_at is not null
    and sts.reservation_expires_at <= now();

  with expired_holds as (
    update private.season_team_slots sts
    set status = 'expired',
        resolved_at = now(),
        updated_at = now(),
        last_action_reason = coalesce(sts.last_action_reason, 'Roster completion deadline passed')
    from public.seasons s
    where sts.season_id = target_season_id
      and s.id = sts.season_id
      and sts.status in ('approved_pending_roster', 'ready')
      and sts.hold_expires_at is not null
      and sts.hold_expires_at <= now()
      and (
        select count(*)
        from public.team_memberships tm
        where tm.team_id = sts.team_id
          and tm.season_id = sts.season_id
          and tm.ends_at is null
      ) < s.minimum_committed_roster
    returning sts.id
  )
  update private.team_applications ta
  set status = 'expired',
      updated_at = now(),
      admin_notes = coalesce(ta.admin_notes, 'Roster completion deadline passed')
  where ta.slot_id in (select id from expired_holds)
    and ta.status in ('approved_pending_roster', 'ready');
end;
$$;

create or replace function private.refresh_team_slot_readiness(target_team_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
  minimum_count integer;
  target_slot_id uuid;
  target_status text;
begin
  select sts.id, sts.status, s.minimum_committed_roster
  into target_slot_id, target_status, minimum_count
  from private.season_team_slots sts
  join public.seasons s on s.id = sts.season_id
  where sts.team_id = target_team_id
  order by sts.created_at desc
  limit 1
  for update of sts;

  if target_slot_id is null or target_status not in ('approved_pending_roster', 'ready') then
    return;
  end if;

  select count(*)::integer
  into active_count
  from public.team_memberships tm
  where tm.team_id = target_team_id
    and tm.ends_at is null;

  if active_count >= minimum_count and target_status = 'approved_pending_roster' then
    update private.season_team_slots
    set status = 'ready', updated_at = now()
    where id = target_slot_id;

    update private.team_applications
    set status = 'ready', updated_at = now()
    where slot_id = target_slot_id
      and status = 'approved_pending_roster';
  elsif active_count < minimum_count and target_status = 'ready' then
    update private.season_team_slots
    set status = 'approved_pending_roster', updated_at = now()
    where id = target_slot_id;

    update private.team_applications
    set status = 'approved_pending_roster', updated_at = now()
    where slot_id = target_slot_id
      and status = 'ready';
  end if;
end;
$$;

create or replace function private.refresh_team_slot_readiness_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform private.refresh_team_slot_readiness(old.team_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform private.refresh_team_slot_readiness(new.team_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_team_slot_readiness_on_membership on public.team_memberships;
create trigger refresh_team_slot_readiness_on_membership
after insert or update or delete on public.team_memberships
for each row execute function private.refresh_team_slot_readiness_trigger();

create or replace function public.configure_season_registration(
  actor_user_id uuid,
  target_season_id uuid,
  configured_team_capacity integer,
  configured_minimum_committed_roster integer,
  configured_returning_reservation_deadline timestamptz,
  configured_conditional_hold_days integer
)
returns table(
  season_id uuid,
  team_capacity integer,
  minimum_committed_roster integer,
  returning_reservation_deadline timestamptz,
  conditional_hold_days integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if configured_team_capacity not between 2 and 32 then
    raise exception 'team_capacity must be between 2 and 32';
  end if;
  if configured_minimum_committed_roster not between 1 and 20 then
    raise exception 'minimum_committed_roster must be between 1 and 20';
  end if;
  if configured_conditional_hold_days not between 1 and 90 then
    raise exception 'conditional_hold_days must be between 1 and 90';
  end if;

  update public.seasons s
  set team_capacity = configured_team_capacity,
      minimum_committed_roster = configured_minimum_committed_roster,
      returning_reservation_deadline = configured_returning_reservation_deadline,
      conditional_hold_days = configured_conditional_hold_days,
      updated_at = now()
  where s.id = target_season_id
    and s.status in ('draft', 'registration');

  if not found then
    if exists (select 1 from public.seasons s where s.id = target_season_id) then
      raise exception 'Season registration settings can only change before publication';
    end if;
    raise exception 'Season not found';
  end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'season.configure_registration',
    'season',
    target_season_id,
    jsonb_build_object(
      'teamCapacity', configured_team_capacity,
      'minimumCommittedRoster', configured_minimum_committed_roster,
      'returningReservationDeadline', configured_returning_reservation_deadline,
      'conditionalHoldDays', configured_conditional_hold_days
    )
  );

  return query
  select s.id, s.team_capacity, s.minimum_committed_roster,
         s.returning_reservation_deadline, s.conditional_hold_days
  from public.seasons s where s.id = target_season_id;
end;
$$;

create or replace function public.submit_team_application(
  actor_user_id uuid,
  target_season_id uuid,
  proposed_team_name text
)
returns table(id uuid, season_id uuid, status text, team_name text, submitted_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  normalized_name text;
  inserted_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  normalized_name := btrim(proposed_team_name);
  if normalized_name is null or char_length(normalized_name) not between 1 and 80 then
    raise exception 'proposed_team_name must be 80 characters or fewer';
  end if;

  if not exists (
    select 1 from public.seasons s
    where s.id = target_season_id and s.status = 'registration'
  ) then
    raise exception 'Season is not open for team applications';
  end if;

  perform private.expire_season_team_registration(target_season_id);

  select p.id into actor_player_id
  from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before applying for a team'; end if;

  if exists (
    select 1 from public.teams t
    where t.season_id = target_season_id
      and lower(btrim(t.name)) = lower(normalized_name)
  ) or exists (
    select 1
    from private.season_team_slots sts
    join public.teams source_team on source_team.id = sts.source_team_id
    where sts.season_id = target_season_id
      and sts.status in ('reserved', 'transferred')
      and lower(btrim(source_team.name)) = lower(normalized_name)
  ) then
    raise exception 'That team name is already reserved for this season';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'You already captain a team in this season';
  end if;

  insert into private.team_applications(
    season_id, applicant_player_id, proposed_team_name
  ) values (
    target_season_id, actor_player_id, normalized_name
  ) returning private.team_applications.id into inserted_id;

  return query
  select ta.id, ta.season_id, ta.status, ta.proposed_team_name, ta.submitted_at
  from private.team_applications ta where ta.id = inserted_id;
end;
$$;

create or replace function public.withdraw_team_application(
  actor_user_id uuid,
  target_application_id uuid
)
returns table(id uuid, status text, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  select p.id into actor_player_id
  from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;

  update private.team_applications ta
  set status = 'withdrawn', updated_at = now()
  where ta.id = target_application_id
    and ta.applicant_player_id = actor_player_id
    and ta.status in ('applied', 'deferred');

  if not found then raise exception 'Team application cannot be withdrawn'; end if;

  return query
  select ta.id, ta.status, ta.updated_at
  from private.team_applications ta where ta.id = target_application_id;
end;
$$;

create or replace function public.admin_review_team_application(
  actor_user_id uuid,
  target_application_id uuid,
  review_decision text,
  review_reason text
)
returns table(
  application_id uuid,
  application_status text,
  team_id uuid,
  slot_id uuid,
  hold_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_row private.team_applications%rowtype;
  target_capacity integer;
  hold_days integer;
  occupied_slots integer;
  inserted_team_id uuid;
  inserted_slot_id uuid;
  target_hold_expires_at timestamptz;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if review_decision not in ('approve', 'defer', 'reject') then
    raise exception 'review_decision must be approve, defer, or reject';
  end if;

  select * into application_row
  from private.team_applications ta
  where ta.id = target_application_id
  for update;
  if not found then raise exception 'Team application not found'; end if;
  if application_row.status not in ('applied', 'deferred') then
    raise exception 'Team application is no longer waiting for review';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'season_team_capacity:' || application_row.season_id::text, 0
  ));
  perform private.expire_season_team_registration(application_row.season_id);

  if review_decision in ('defer', 'reject') then
    update private.team_applications ta
    set status = case when review_decision = 'defer' then 'deferred' else 'rejected' end,
        admin_notes = nullif(btrim(review_reason), ''),
        reviewed_at = now(),
        reviewed_by_user_id = actor_user_id,
        updated_at = now()
    where ta.id = target_application_id;
  else
    select s.team_capacity, s.conditional_hold_days
    into target_capacity, hold_days
    from public.seasons s
    where s.id = application_row.season_id
      and s.status = 'registration'
    for update;
    if not found then raise exception 'Season is not open for team applications'; end if;

    select count(*)::integer into occupied_slots
    from private.season_team_slots sts
    where sts.season_id = application_row.season_id
      and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed');

    if occupied_slots >= target_capacity then
      raise exception 'No team slots are currently available';
    end if;

    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = application_row.season_id
        and tm.player_id = application_row.applicant_player_id
        and tm.role = 'captain'
        and tm.ends_at is null
    ) then
      raise exception 'Applicant already captains a team in this season';
    end if;

    if exists (
      select 1 from public.teams t
      where t.season_id = application_row.season_id
        and lower(btrim(t.name)) = lower(btrim(application_row.proposed_team_name))
    ) or exists (
      select 1
      from private.season_team_slots sts
      join public.teams source_team on source_team.id = sts.source_team_id
      where sts.season_id = application_row.season_id
        and sts.status in ('reserved', 'transferred')
        and lower(btrim(source_team.name)) = lower(btrim(application_row.proposed_team_name))
    ) then
      raise exception 'That team name is already reserved for this season';
    end if;

    insert into public.teams(season_id, name, created_by)
    select application_row.season_id, application_row.proposed_team_name, p.user_id
    from public.players p where p.id = application_row.applicant_player_id
    returning public.teams.id into inserted_team_id;

    insert into public.team_memberships(season_id, team_id, player_id, role)
    values (
      application_row.season_id,
      inserted_team_id,
      application_row.applicant_player_id,
      'captain'
    );

    target_hold_expires_at := now() + make_interval(days => hold_days);
    insert into private.season_team_slots(
      season_id, team_id, assigned_captain_player_id, status, hold_expires_at
    ) values (
      application_row.season_id,
      inserted_team_id,
      application_row.applicant_player_id,
      'approved_pending_roster',
      target_hold_expires_at
    ) returning private.season_team_slots.id into inserted_slot_id;

    update private.team_applications ta
    set status = 'approved_pending_roster',
        team_id = inserted_team_id,
        slot_id = inserted_slot_id,
        admin_notes = nullif(btrim(review_reason), ''),
        reviewed_at = now(),
        reviewed_by_user_id = actor_user_id,
        updated_at = now()
    where ta.id = target_application_id;

    perform private.refresh_team_slot_readiness(inserted_team_id);
  end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'team_application.' || review_decision,
    'team_application',
    target_application_id,
    jsonb_build_object('reason', nullif(btrim(review_reason), ''))
  );

  return query
  select ta.id, ta.status, ta.team_id, ta.slot_id, sts.hold_expires_at
  from private.team_applications ta
  left join private.season_team_slots sts on sts.id = ta.slot_id
  where ta.id = target_application_id;
end;
$$;

create or replace function public.admin_manage_team_slot(
  actor_user_id uuid,
  target_slot_id uuid,
  slot_action text,
  action_reason text,
  extension_days integer default null
)
returns table(slot_id uuid, slot_status text, hold_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  slot_row private.season_team_slots%rowtype;
  minimum_count integer;
  active_count integer;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if slot_action not in ('confirm', 'release', 'extend', 'expire') then
    raise exception 'slot_action must be confirm, release, extend, or expire';
  end if;
  if slot_action in ('release', 'extend', 'expire')
      and nullif(btrim(action_reason), '') is null then
    raise exception 'An audit reason is required';
  end if;

  select * into slot_row
  from private.season_team_slots sts
  where sts.id = target_slot_id
  for update;
  if not found then raise exception 'Team slot not found'; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'season_team_capacity:' || slot_row.season_id::text, 0
  ));
  perform private.expire_season_team_registration(slot_row.season_id);

  if slot_action = 'confirm' then
    if slot_row.team_id is null then raise exception 'Team slot has no assigned team'; end if;
    select s.minimum_committed_roster into minimum_count
    from public.seasons s where s.id = slot_row.season_id;
    select count(*)::integer into active_count
    from public.team_memberships tm
    where tm.team_id = slot_row.team_id and tm.ends_at is null;
    if active_count < minimum_count then
      raise exception 'Team must meet the minimum committed roster before confirmation';
    end if;
    update private.season_team_slots
    set status = 'confirmed', resolved_at = now(), updated_at = now()
    where id = target_slot_id and status in ('ready', 'approved_pending_roster');
    if not found then raise exception 'Team slot is not ready for confirmation'; end if;
    update private.team_applications
    set status = 'confirmed', updated_at = now()
    where slot_id = target_slot_id;
  elsif slot_action = 'extend' then
    if extension_days is null or extension_days not between 1 and 90 then
      raise exception 'extension_days must be between 1 and 90';
    end if;
    update private.season_team_slots
    set hold_expires_at = greatest(coalesce(hold_expires_at, now()), now())
          + make_interval(days => extension_days),
        last_action_reason = btrim(action_reason),
        updated_at = now()
    where id = target_slot_id and status in ('approved_pending_roster', 'ready');
    if not found then raise exception 'Only a roster hold can be extended'; end if;
  else
    update private.season_team_slots
    set status = case when slot_action = 'release' then 'released' else 'expired' end,
        resolved_at = now(),
        last_action_reason = btrim(action_reason),
        updated_at = now()
    where id = target_slot_id
      and status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed');
    if not found then raise exception 'Team slot is no longer active'; end if;
    update private.team_applications
    set status = case when slot_action = 'release' then 'deferred' else 'expired' end,
        updated_at = now()
    where slot_id = target_slot_id
      and status in ('approved_pending_roster', 'ready', 'confirmed');
  end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'team_slot.' || slot_action,
    'season_team_slot',
    target_slot_id,
    jsonb_build_object('reason', nullif(btrim(action_reason), ''), 'extensionDays', extension_days)
  );

  return query
  select sts.id, sts.status, sts.hold_expires_at
  from private.season_team_slots sts where sts.id = target_slot_id;
end;
$$;

create or replace function public.seed_returning_team_slots(
  actor_user_id uuid,
  target_season_id uuid,
  source_season_id uuid
)
returns table(created_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_capacity integer;
  occupied_count integer;
  remaining_count integer;
  expiry_at timestamptz;
  inserted_count integer;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if target_season_id = source_season_id then
    raise exception 'Source and target seasons must differ';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'season_team_capacity:' || target_season_id::text, 0
  ));
  perform private.expire_season_team_registration(target_season_id);

  select s.team_capacity,
         coalesce(s.returning_reservation_deadline, now() + interval '14 days')
  into target_capacity, expiry_at
  from public.seasons s
  where s.id = target_season_id and s.status = 'registration'
  for update;
  if not found then raise exception 'Target season is not open for registration'; end if;

  select count(*)::integer into occupied_count
  from private.season_team_slots sts
  where sts.season_id = target_season_id
    and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed');
  remaining_count := greatest(0, target_capacity - occupied_count);

  with returning_teams as (
    select t.id as source_team_id, tm.player_id as captain_player_id
    from public.teams t
    join public.team_memberships tm
      on tm.team_id = t.id
     and tm.season_id = t.season_id
     and tm.role = 'captain'
     and tm.ends_at is null
    where t.season_id = source_season_id
      and not exists (
        select 1 from private.season_team_slots existing
        where existing.season_id = target_season_id
          and existing.source_team_id = t.id
      )
    order by t.created_at, t.id
    limit remaining_count
  ), inserted as (
    insert into private.season_team_slots(
      season_id,
      source_team_id,
      returning_captain_player_id,
      assigned_captain_player_id,
      status,
      reservation_expires_at
    )
    select target_season_id, source_team_id, captain_player_id, captain_player_id,
           'reserved', expiry_at
    from returning_teams
    returning 1
  )
  select count(*)::integer into inserted_count from inserted;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'season.seed_returning_team_slots',
    'season',
    target_season_id,
    jsonb_build_object('sourceSeasonId', source_season_id, 'createdCount', inserted_count)
  );

  created_count := inserted_count;
  return next;
end;
$$;

create or replace function public.respond_to_returning_team_slot(
  actor_user_id uuid,
  target_slot_id uuid,
  response_action text,
  transfer_player_id uuid default null
)
returns table(slot_id uuid, slot_status text, team_id uuid, assigned_captain_player_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  slot_row private.season_team_slots%rowtype;
  target_captain_player_id uuid;
  target_captain_user_id uuid;
  source_team_name text;
  inserted_team_id uuid;
begin
  if response_action not in ('confirm', 'release', 'transfer') then
    raise exception 'response_action must be confirm, release, or transfer';
  end if;
  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;

  select * into slot_row
  from private.season_team_slots sts where sts.id = target_slot_id
  for update;
  if not found then raise exception 'Returning team slot not found'; end if;

  perform private.expire_season_team_registration(slot_row.season_id);
  select * into slot_row
  from private.season_team_slots sts where sts.id = target_slot_id
  for update;

  if slot_row.status not in ('reserved', 'transferred') then
    raise exception 'Returning team slot is no longer awaiting a response';
  end if;
  if slot_row.assigned_captain_player_id <> actor_player_id then
    raise exception 'Only the assigned returning captain can respond';
  end if;

  if response_action = 'release' then
    update private.season_team_slots
    set status = 'released', resolved_at = now(), updated_at = now()
    where id = target_slot_id;
  elsif response_action = 'transfer' then
    if transfer_player_id is null or transfer_player_id = actor_player_id then
      raise exception 'Choose another eligible player for the transfer';
    end if;
    if not exists (select 1 from public.players p where p.id = transfer_player_id and p.user_id is not null) then
      raise exception 'Transfer player must have a signed-in player profile';
    end if;
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = slot_row.season_id
        and tm.player_id = transfer_player_id
        and tm.role = 'captain'
        and tm.ends_at is null
    ) then
      raise exception 'Transfer player already captains a team in this season';
    end if;
    update private.season_team_slots
    set status = 'transferred',
        assigned_captain_player_id = transfer_player_id,
        updated_at = now()
    where id = target_slot_id;
  else
    target_captain_player_id := slot_row.assigned_captain_player_id;
    select p.user_id into target_captain_user_id
    from public.players p where p.id = target_captain_player_id;
    select t.name into source_team_name
    from public.teams t where t.id = slot_row.source_team_id;
    if target_captain_user_id is null then
      raise exception 'Assigned captain must have a signed-in player profile';
    end if;
    if exists (
      select 1 from public.team_memberships tm
      where tm.season_id = slot_row.season_id
        and tm.player_id = target_captain_player_id
        and tm.role = 'captain'
        and tm.ends_at is null
    ) then
      raise exception 'Assigned captain already captains a team in this season';
    end if;

    insert into public.teams(season_id, name, created_by)
    values(slot_row.season_id, source_team_name, target_captain_user_id)
    returning public.teams.id into inserted_team_id;
    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(slot_row.season_id, inserted_team_id, target_captain_player_id, 'captain');
    update private.season_team_slots
    set status = 'confirmed',
        team_id = inserted_team_id,
        resolved_at = now(),
        updated_at = now()
    where id = target_slot_id;
  end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'returning_team_slot.' || response_action,
    'season_team_slot',
    target_slot_id,
    jsonb_build_object('transferPlayerId', transfer_player_id)
  );

  return query
  select sts.id, sts.status, sts.team_id, sts.assigned_captain_player_id
  from private.season_team_slots sts where sts.id = target_slot_id;
end;
$$;

create or replace function public.list_public_season_registration()
returns table(
  id uuid,
  name text,
  status text,
  first_round_date date,
  team_capacity integer,
  minimum_committed_roster integer,
  team_count integer,
  confirmed_team_count integer,
  occupied_slots integer,
  open_team_slots integer,
  reserved_returning_slots integer,
  held_team_slots integer,
  applications_waiting integer,
  rostered_player_count integer,
  registered_player_count integer,
  free_agent_count integer,
  at_risk_team_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  season_row record;
begin
  for season_row in select s.id from public.seasons s loop
    perform private.expire_season_team_registration(season_row.id);
  end loop;

  return query
  select
    s.id,
    s.name,
    s.status,
    s.first_round_date,
    s.team_capacity,
    s.minimum_committed_roster,
    count(distinct sts.team_id) filter (
      where sts.team_id is not null
        and sts.status in ('approved_pending_roster', 'ready', 'confirmed')
    )::integer as team_count,
    count(distinct sts.team_id) filter (
      where sts.team_id is not null and sts.status = 'confirmed'
    )::integer as confirmed_team_count,
    count(distinct sts.id) filter (
      where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
    )::integer as occupied_slots,
    greatest(0, s.team_capacity - count(distinct sts.id) filter (
      where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
    ))::integer as open_team_slots,
    count(distinct sts.id) filter (where sts.status in ('reserved', 'transferred'))::integer,
    count(distinct sts.id) filter (where sts.status in ('approved_pending_roster', 'ready'))::integer,
    count(distinct ta.id) filter (where ta.status in ('applied', 'deferred'))::integer,
    count(distinct tm.player_id) filter (where tm.ends_at is null)::integer,
    count(distinct sp.player_id) filter (where sp.status = 'active')::integer,
    count(distinct sp.player_id) filter (
      where sp.status = 'active'
        and sp.participation_type = 'free_agent'
        and not exists (
          select 1 from public.team_memberships active_tm
          where active_tm.season_id = s.id
            and active_tm.player_id = sp.player_id
            and active_tm.ends_at is null
        )
    )::integer,
    count(distinct sts.team_id) filter (
      where sts.status = 'confirmed'
        and (
          select count(*) from public.team_memberships viable_tm
          where viable_tm.team_id = sts.team_id and viable_tm.ends_at is null
        ) < s.minimum_committed_roster
    )::integer
  from public.seasons s
  left join private.season_team_slots sts on sts.season_id = s.id
  left join private.team_applications ta on ta.season_id = s.id
  left join public.team_memberships tm on tm.season_id = s.id
  left join public.season_players sp on sp.season_id = s.id
  group by s.id
  order by s.created_at desc;
end;
$$;

create or replace function public.get_own_team_registration(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(registration jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  select p.id into actor_player_id from public.players p where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required'; end if;
  perform private.expire_season_team_registration(target_season_id);

  return query
  select jsonb_build_object(
    'seasonId', s.id,
    'seasonName', s.name,
    'seasonStatus', s.status,
    'teamCapacity', s.team_capacity,
    'minimumCommittedRoster', s.minimum_committed_roster,
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'applicationId', ta.id,
        'proposedTeamName', ta.proposed_team_name,
        'status', ta.status,
        'submittedAt', ta.submitted_at,
        'teamId', ta.team_id,
        'holdExpiresAt', sts.hold_expires_at
      ) order by ta.submitted_at desc)
      from private.team_applications ta
      left join private.season_team_slots sts on sts.id = ta.slot_id
      where ta.season_id = s.id and ta.applicant_player_id = actor_player_id
    ), '[]'::jsonb),
    'returningSlots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slotId', sts.id,
        'sourceTeamId', sts.source_team_id,
        'sourceTeamName', source_team.name,
        'status', sts.status,
        'reservationExpiresAt', sts.reservation_expires_at
      ) order by source_team.name)
      from private.season_team_slots sts
      join public.teams source_team on source_team.id = sts.source_team_id
      where sts.season_id = s.id
        and sts.assigned_captain_player_id = actor_player_id
        and sts.status in ('reserved', 'transferred')
    ), '[]'::jsonb)
  )
  from public.seasons s where s.id = target_season_id;
end;
$$;

create or replace function public.list_joinable_team_registration()
returns table(
  team_id uuid,
  team_name text,
  season_id uuid,
  season_name text,
  season_status text,
  slot_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  season_row record;
begin
  for season_row in
    select s.id from public.seasons s where s.status in ('registration', 'active')
  loop
    perform private.expire_season_team_registration(season_row.id);
  end loop;

  return query
  select
    t.id,
    t.name,
    s.id,
    s.name,
    s.status,
    sts.status
  from private.season_team_slots sts
  join public.teams t on t.id = sts.team_id
  join public.seasons s on s.id = sts.season_id
  where s.status in ('registration', 'active')
    and sts.status in ('approved_pending_roster', 'ready', 'confirmed')
  order by s.created_at desc, t.name;
end;
$$;

create or replace function public.list_publishable_season_teams(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(id uuid, active boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  perform private.expire_season_team_registration(target_season_id);

  return query
  select sts.team_id, true
  from private.season_team_slots sts
  join public.seasons s on s.id = sts.season_id
  join public.teams t on t.id = sts.team_id
  where sts.season_id = target_season_id
    and sts.status = 'confirmed'
    and (
      select count(*)
      from public.team_memberships tm
      where tm.team_id = sts.team_id
        and tm.season_id = sts.season_id
        and tm.ends_at is null
    ) >= s.minimum_committed_roster
  order by t.name;
end;
$$;

create or replace function public.request_team_membership(
  actor_user_id uuid,
  target_team_id uuid
)
returns table(
  id uuid,
  season_id uuid,
  team_id uuid,
  player_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  target_season_id uuid;
  request_id uuid;
  pending_invitation_id uuid;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before requesting a team'; end if;

  select t.season_id into target_season_id
  from public.teams t
  where t.id = target_team_id;
  if not found then raise exception 'Team not found'; end if;

  perform private.expire_season_team_registration(target_season_id);
  if not exists (
    select 1 from private.season_team_slots sts
    where sts.season_id = target_season_id
      and sts.team_id = target_team_id
      and sts.status in ('approved_pending_roster', 'ready', 'confirmed')
  ) then
    raise exception 'This team is not accepting season roster requests';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = target_team_id
      and tm.player_id = actor_player_id
      and tm.ends_at is null
  ) then
    raise exception 'Player is already an active member of this team';
  end if;

  if exists (
    select 1 from private.team_membership_requests r
    where r.season_id = target_season_id
      and r.team_id = target_team_id
      and r.player_id = actor_player_id
      and r.status = 'pending'
  ) then
    raise exception 'Membership request is already pending';
  end if;

  select ti.id into pending_invitation_id
  from private.team_invitations ti
  where ti.season_id = target_season_id
    and ti.team_id = target_team_id
    and ti.invited_player_id = actor_player_id
    and ti.status = 'pending'
  order by ti.created_at
  limit 1
  for update;

  if pending_invitation_id is not null then
    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(target_season_id, target_team_id, actor_player_id, 'player');

    insert into private.team_membership_requests(
      season_id, team_id, player_id, status, resolved_at, resolved_by_user_id
    ) values (
      target_season_id, target_team_id, actor_player_id, 'approved', now(), actor_user_id
    ) returning private.team_membership_requests.id into request_id;

    update private.team_invitations
    set status = 'accepted', responded_at = now()
    where private.team_invitations.id = pending_invitation_id;
  else
    insert into private.team_membership_requests(season_id, team_id, player_id)
    values(target_season_id, target_team_id, actor_player_id)
    returning private.team_membership_requests.id into request_id;
  end if;

  return query
  select r.id, r.season_id, r.team_id, r.player_id, r.status, r.created_at
  from private.team_membership_requests r
  where r.id = request_id;
end;
$$;

create or replace function public.get_admin_season_registration(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(registration jsonb)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  perform private.expire_season_team_registration(target_season_id);

  return query
  select jsonb_build_object(
    'seasonId', s.id,
    'seasonName', s.name,
    'seasonStatus', s.status,
    'teamCapacity', s.team_capacity,
    'minimumCommittedRoster', s.minimum_committed_roster,
    'returningReservationDeadline', s.returning_reservation_deadline,
    'conditionalHoldDays', s.conditional_hold_days,
    'counts', jsonb_build_object(
      'occupiedSlots', count(distinct sts.id) filter (
        where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
      ),
      'confirmedTeams', count(distinct sts.team_id) filter (where sts.status = 'confirmed'),
      'reservedReturningSlots', count(distinct sts.id) filter (where sts.status in ('reserved', 'transferred')),
      'heldTeams', count(distinct sts.id) filter (where sts.status in ('approved_pending_roster', 'ready')),
      'availableSlots', greatest(0, s.team_capacity - count(distinct sts.id) filter (
        where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
      )),
      'applicationsWaiting', count(distinct ta.id) filter (where ta.status in ('applied', 'deferred')),
      'rosteredPlayers', count(distinct tm.player_id) filter (where tm.ends_at is null),
      'registeredPlayers', count(distinct sp.player_id) filter (where sp.status = 'active'),
      'freeAgents', count(distinct sp.player_id) filter (
        where sp.status = 'active' and sp.participation_type = 'free_agent'
      ),
      'pendingInvitations', count(distinct ti.id) filter (where ti.status = 'pending')
    ),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'applicationId', app.id,
        'proposedTeamName', app.proposed_team_name,
        'status', app.status,
        'applicantPlayerId', p.id,
        'applicantDisplayName', p.display_name,
        'submittedAt', app.submitted_at,
        'reviewedAt', app.reviewed_at,
        'adminNotes', app.admin_notes,
        'teamId', app.team_id,
        'slotId', app.slot_id
      ) order by app.submitted_at)
      from private.team_applications app
      join public.players p on p.id = app.applicant_player_id
      where app.season_id = s.id
    ), '[]'::jsonb),
    'slots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slotId', slot.id,
        'status', slot.status,
        'teamId', slot.team_id,
        'teamName', current_team.name,
        'sourceTeamId', slot.source_team_id,
        'sourceTeamName', source_team.name,
        'captainPlayerId', slot.assigned_captain_player_id,
        'captainDisplayName', captain.display_name,
        'activeRosterCount', (
          select count(*) from public.team_memberships active_tm
          where active_tm.team_id = slot.team_id and active_tm.ends_at is null
        ),
        'reservationExpiresAt', slot.reservation_expires_at,
        'holdExpiresAt', slot.hold_expires_at,
        'lastActionReason', slot.last_action_reason
      ) order by coalesce(current_team.name, source_team.name))
      from private.season_team_slots slot
      left join public.teams current_team on current_team.id = slot.team_id
      left join public.teams source_team on source_team.id = slot.source_team_id
      left join public.players captain on captain.id = slot.assigned_captain_player_id
      where slot.season_id = s.id
    ), '[]'::jsonb)
  )
  from public.seasons s
  left join private.season_team_slots sts on sts.season_id = s.id
  left join private.team_applications ta on ta.season_id = s.id
  left join public.team_memberships tm on tm.season_id = s.id
  left join public.season_players sp on sp.season_id = s.id
  left join private.team_invitations ti on ti.season_id = s.id
  where s.id = target_season_id
  group by s.id;
end;
$$;

create or replace function public.create_team_with_captain(
  actor_user_id uuid,
  target_season_id uuid,
  team_name text
)
returns table(id uuid, season_id uuid, name text, captain_player_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'New teams must apply for a season slot before a team is created';
end;
$$;

create or replace function public.publish_season_schedule(
  target_season_id uuid,
  actor_user_id uuid,
  expected_previous_status text,
  rounds_payload jsonb
)
returns table(round_count integer, team_match_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  required_team_count integer;
  viable_team_count integer;
  inserted_round_id uuid;
  inserted_round_count integer := 0;
  inserted_match_count integer := 0;
  round_item jsonb;
  match_item jsonb;
begin
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if not exists(select 1 from private.league_admins la where la.user_id = actor_user_id) then
    raise exception 'Actor is not a league admin';
  end if;
  if jsonb_typeof(rounds_payload) is distinct from 'array' then
    raise exception 'rounds_payload must be an array';
  end if;

  perform private.expire_season_team_registration(target_season_id);
  select s.status, s.team_capacity into current_status, required_team_count
  from public.seasons s where s.id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;
  if current_status is distinct from expected_previous_status then raise exception 'Season status changed'; end if;
  if current_status not in ('draft', 'registration') then
    raise exception 'Season must be draft or registration to publish';
  end if;

  select count(*)::integer into viable_team_count
  from private.season_team_slots sts
  where sts.season_id = target_season_id
    and sts.status = 'confirmed'
    and (
      select count(*) from public.team_memberships tm
      where tm.team_id = sts.team_id and tm.ends_at is null
    ) >= (
      select s.minimum_committed_roster from public.seasons s where s.id = target_season_id
    );

  if viable_team_count <> required_team_count then
    raise exception 'Season requires exactly % confirmed teams meeting the minimum roster before publication', required_team_count;
  end if;
  if exists(select 1 from public.rounds r where r.season_id = target_season_id) then
    raise exception 'Season schedule already exists';
  end if;

  update public.seasons set status = 'active' where id = target_season_id;
  for round_item in select value from jsonb_array_elements(rounds_payload) loop
    if jsonb_typeof(round_item->'matches') is distinct from 'array' then
      raise exception 'round matches must be an array';
    end if;
    insert into public.rounds(season_id, round_number, stage, scheduled_on)
    values(
      target_season_id,
      (round_item->>'roundNumber')::integer,
      coalesce(round_item->>'stage', 'regular'),
      (round_item->>'scheduledOn')::date
    ) returning id into inserted_round_id;
    inserted_round_count := inserted_round_count + 1;
    for match_item in select value from jsonb_array_elements(round_item->'matches') loop
      insert into public.team_matches(season_id, round_id, table_number, team_a_id, team_b_id)
      values(
        target_season_id,
        inserted_round_id,
        (match_item->>'tableNumber')::integer,
        (match_item->>'teamAId')::uuid,
        (match_item->>'teamBId')::uuid
      );
      inserted_match_count := inserted_match_count + 1;
    end loop;
  end loop;
  if inserted_round_count <> 7 then raise exception 'Season 1 publication requires 7 rounds'; end if;
  if inserted_match_count <> 28 then raise exception 'Season 1 publication requires 28 team matches'; end if;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values(
    actor_user_id,
    'season.publish_schedule',
    'season',
    target_season_id,
    jsonb_build_object('status', current_status),
    jsonb_build_object('status', 'active', 'roundCount', inserted_round_count, 'teamMatchCount', inserted_match_count)
  );
  round_count := inserted_round_count;
  team_match_count := inserted_match_count;
  return next;
end;
$$;

insert into private.season_team_slots(
  season_id,
  team_id,
  assigned_captain_player_id,
  status,
  hold_expires_at,
  resolved_at,
  last_action_reason
)
select
  t.season_id,
  t.id,
  captain.player_id,
  case
    when s.status = 'registration' and roster.active_count >= s.minimum_committed_roster then 'ready'
    when s.status = 'registration' then 'approved_pending_roster'
    else 'confirmed'
  end,
  case when s.status = 'registration'
    then now() + make_interval(days => s.conditional_hold_days)
    else null
  end,
  case when s.status = 'registration' then null else now() end,
  'Backfilled from an existing season team'
from public.teams t
join public.seasons s on s.id = t.season_id
join lateral (
  select tm.player_id
  from public.team_memberships tm
  where tm.team_id = t.id
    and tm.role = 'captain'
    and tm.ends_at is null
  order by tm.starts_at
  limit 1
) captain on true
join lateral (
  select count(*)::integer as active_count
  from public.team_memberships tm
  where tm.team_id = t.id and tm.ends_at is null
) roster on true
where not exists (
  select 1 from private.season_team_slots existing
  where existing.season_id = t.season_id and existing.team_id = t.id
);

insert into private.team_applications(
  season_id,
  applicant_player_id,
  proposed_team_name,
  status,
  team_id,
  slot_id,
  admin_notes,
  reviewed_at,
  updated_at
)
select
  sts.season_id,
  sts.assigned_captain_player_id,
  t.name,
  sts.status,
  sts.team_id,
  sts.id,
  'Backfilled from an existing registration team',
  now(),
  now()
from private.season_team_slots sts
join public.seasons s on s.id = sts.season_id and s.status = 'registration'
join public.teams t on t.id = sts.team_id
where sts.status in ('approved_pending_roster', 'ready')
  and not exists (
    select 1 from private.team_applications ta
    where ta.season_id = sts.season_id
      and ta.applicant_player_id = sts.assigned_captain_player_id
      and ta.status in ('applied', 'deferred', 'approved_pending_roster', 'ready', 'confirmed')
  );

revoke execute on function private.expire_season_team_registration(uuid) from public, anon, authenticated;
revoke execute on function private.refresh_team_slot_readiness(uuid) from public, anon, authenticated;
revoke execute on function private.refresh_team_slot_readiness_trigger() from public, anon, authenticated;

revoke execute on function public.configure_season_registration(uuid, uuid, integer, integer, timestamptz, integer) from public, anon, authenticated;
revoke execute on function public.submit_team_application(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.withdraw_team_application(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.admin_review_team_application(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.admin_manage_team_slot(uuid, uuid, text, text, integer) from public, anon, authenticated;
revoke execute on function public.seed_returning_team_slots(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.respond_to_returning_team_slot(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public.list_public_season_registration() from public, anon, authenticated;
revoke execute on function public.list_joinable_team_registration() from public, anon, authenticated;
revoke execute on function public.list_publishable_season_teams(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.get_own_team_registration(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.get_admin_season_registration(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_team_with_captain(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.publish_season_schedule(uuid, uuid, text, jsonb) from public, anon, authenticated;

grant execute on function public.configure_season_registration(uuid, uuid, integer, integer, timestamptz, integer) to service_role;
grant execute on function public.submit_team_application(uuid, uuid, text) to service_role;
grant execute on function public.withdraw_team_application(uuid, uuid) to service_role;
grant execute on function public.admin_review_team_application(uuid, uuid, text, text) to service_role;
grant execute on function public.admin_manage_team_slot(uuid, uuid, text, text, integer) to service_role;
grant execute on function public.seed_returning_team_slots(uuid, uuid, uuid) to service_role;
grant execute on function public.respond_to_returning_team_slot(uuid, uuid, text, uuid) to service_role;
grant execute on function public.list_public_season_registration() to service_role;
grant execute on function public.list_joinable_team_registration() to service_role;
grant execute on function public.list_publishable_season_teams(uuid, uuid) to service_role;
grant execute on function public.get_own_team_registration(uuid, uuid) to service_role;
grant execute on function public.get_admin_season_registration(uuid, uuid) to service_role;
grant execute on function public.create_team_with_captain(uuid, uuid, text) to service_role;
grant execute on function public.publish_season_schedule(uuid, uuid, text, jsonb) to service_role;
