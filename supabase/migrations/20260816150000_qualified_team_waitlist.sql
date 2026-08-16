-- #409 Persist qualified-team waitlist and deterministic slot ordering

alter table private.team_applications
  drop constraint if exists team_applications_status_check;

alter table private.team_applications
  add constraint team_applications_status_check check (
    status in (
      'applied',
      'deferred',
      'waitlisted',
      'approved_pending_roster',
      'ready',
      'confirmed',
      'rejected',
      'withdrawn',
      'expired'
    )
  );

alter table private.team_applications
  add column if not exists first_qualified_at timestamptz,
  add column if not exists waitlist_rank_override integer,
  add column if not exists waitlist_override_reason text,
  add column if not exists waitlist_override_at timestamptz,
  add column if not exists waitlist_override_by uuid references auth.users(id);

create index if not exists team_applications_waitlist_order_idx
  on private.team_applications (season_id, waitlist_rank_override nulls last, first_qualified_at, submitted_at, id)
  where status = 'waitlisted';

create or replace function public.list_season_waitlist(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  application_id uuid,
  proposed_team_name text,
  status text,
  waitlist_position integer,
  first_qualified_at timestamptz,
  submitted_at timestamptz,
  waitlist_rank_override integer,
  waitlist_override_reason text,
  applicant_player_id uuid
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

  return query
  select
    ta.id,
    ta.proposed_team_name,
    ta.status,
    (row_number() over (
      order by
        ta.waitlist_rank_override nulls last,
        ta.first_qualified_at asc nulls last,
        ta.submitted_at asc,
        ta.id asc
    ))::integer as waitlist_position,
    ta.first_qualified_at,
    ta.submitted_at,
    ta.waitlist_rank_override,
    ta.waitlist_override_reason,
    ta.applicant_player_id
  from private.team_applications ta
  where ta.season_id = target_season_id
    and ta.status = 'waitlisted'
  order by
    ta.waitlist_rank_override nulls last,
    ta.first_qualified_at asc nulls last,
    ta.submitted_at asc,
    ta.id asc;
end;
$$;

create or replace function public.get_my_team_application_waitlist_status(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  application_id uuid,
  proposed_team_name text,
  status text,
  waitlist_position integer,
  first_qualified_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  player_id uuid;
begin
  select p.id into player_id
  from public.players p
  where p.user_id = actor_user_id
  limit 1;

  if player_id is null then
    return;
  end if;

  return query
  with ordered as (
    select
      ta.id,
      ta.proposed_team_name,
      ta.status,
      ta.first_qualified_at,
      ta.applicant_player_id,
      row_number() over (
        order by
          ta.waitlist_rank_override nulls last,
          ta.first_qualified_at asc nulls last,
          ta.submitted_at asc,
          ta.id asc
      )::integer as waitlist_position
    from private.team_applications ta
    where ta.season_id = target_season_id
      and ta.status = 'waitlisted'
  )
  select o.id, o.proposed_team_name, o.status, o.waitlist_position, o.first_qualified_at
  from ordered o
  where o.applicant_player_id = player_id;
end;
$$;

create or replace function public.admin_override_waitlist_order(
  actor_user_id uuid,
  target_application_id uuid,
  new_rank integer,
  override_reason text
)
returns table(
  application_id uuid,
  waitlist_rank_override integer,
  waitlist_position integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_row private.team_applications%rowtype;
  reason_text text := nullif(btrim(coalesce(override_reason, '')), '');
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if new_rank is null or new_rank < 1 then
    raise exception 'new_rank must be a positive integer';
  end if;
  if reason_text is null or char_length(reason_text) < 3 then
    raise exception 'Override reason is required (at least 3 characters)';
  end if;

  select * into application_row
  from private.team_applications ta
  where ta.id = target_application_id
  for update;
  if not found then raise exception 'Team application not found'; end if;
  if application_row.status <> 'waitlisted' then
    raise exception 'Only waitlisted applications can receive a rank override';
  end if;

  update private.team_applications ta
  set waitlist_rank_override = new_rank,
      waitlist_override_reason = reason_text,
      waitlist_override_at = now(),
      waitlist_override_by = actor_user_id,
      updated_at = now()
  where ta.id = target_application_id;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'team_application.waitlist_override',
    'team_application',
    target_application_id,
    jsonb_build_object(
      'rank', new_rank,
      'reason', reason_text,
      'seasonId', application_row.season_id
    )
  );

  return query
  select q.application_id, q.waitlist_rank_override, q.waitlist_position
  from public.list_season_waitlist(actor_user_id, application_row.season_id) q
  where q.application_id = target_application_id;
end;
$$;

create or replace function public.promote_next_waitlisted_team(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  application_id uuid,
  application_status text,
  team_id uuid,
  slot_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_app private.team_applications%rowtype;
  target_capacity integer;
  occupied_slots integer;
  hold_days integer;
  inserted_team_id uuid;
  inserted_slot_id uuid;
  target_hold_expires_at timestamptz;
  captain_user_id uuid;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'season_team_capacity:' || target_season_id::text, 0
  ));
  perform private.expire_season_team_registration(target_season_id);

  select s.team_capacity, s.conditional_hold_days
  into target_capacity, hold_days
  from public.seasons s
  where s.id = target_season_id
    and s.status = 'registration'
  for update;
  if not found then
    return;
  end if;

  select count(*)::integer into occupied_slots
  from private.season_team_slots sts
  where sts.season_id = target_season_id
    and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed');

  if occupied_slots >= target_capacity then
    return;
  end if;

  select ta.* into next_app
  from private.team_applications ta
  where ta.season_id = target_season_id
    and ta.status = 'waitlisted'
  order by
    ta.waitlist_rank_override nulls last,
    ta.first_qualified_at asc nulls last,
    ta.submitted_at asc,
    ta.id asc
  limit 1
  for update skip locked;

  if not found then
    return;
  end if;

  select p.user_id into captain_user_id
  from public.players p
  where p.id = next_app.applicant_player_id;

  if captain_user_id is null then
    captain_user_id := actor_user_id;
  end if;

  target_hold_expires_at := now() + make_interval(days => coalesce(hold_days, 7));

  if next_app.team_id is null then
    insert into public.teams (season_id, name, created_by)
    values (target_season_id, next_app.proposed_team_name, captain_user_id)
    returning id into inserted_team_id;

    insert into public.team_memberships (season_id, team_id, player_id, role)
    values (target_season_id, inserted_team_id, next_app.applicant_player_id, 'captain');
  else
    inserted_team_id := next_app.team_id;
  end if;

  insert into private.season_team_slots (
    season_id, team_id, assigned_captain_player_id, status, hold_expires_at
  ) values (
    target_season_id,
    inserted_team_id,
    next_app.applicant_player_id,
    'approved_pending_roster',
    target_hold_expires_at
  )
  returning id into inserted_slot_id;

  update private.team_applications ta
  set status = 'approved_pending_roster',
      team_id = inserted_team_id,
      slot_id = inserted_slot_id,
      first_qualified_at = coalesce(ta.first_qualified_at, now()),
      reviewed_at = coalesce(ta.reviewed_at, now()),
      reviewed_by_user_id = coalesce(ta.reviewed_by_user_id, actor_user_id),
      updated_at = now()
  where ta.id = next_app.id;

  perform private.refresh_team_slot_readiness(inserted_team_id);

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'team_application.waitlist_promote',
    'team_application',
    next_app.id,
    jsonb_build_object(
      'seasonId', target_season_id,
      'teamId', inserted_team_id,
      'slotId', inserted_slot_id,
      'firstQualifiedAt', next_app.first_qualified_at
    )
  );

  return query
  select next_app.id, 'approved_pending_roster'::text, inserted_team_id, inserted_slot_id;
end;
$$;

-- Patch review: full capacity -> durable waitlisted instead of exception.
-- Load prior body from original and only change the capacity branch + waitlisted eligibility.
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
  captain_user_id uuid;
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
  if application_row.status not in ('applied', 'deferred', 'waitlisted') then
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
      update private.team_applications ta
      set status = 'waitlisted',
          first_qualified_at = coalesce(ta.first_qualified_at, now()),
          admin_notes = nullif(btrim(review_reason), ''),
          reviewed_at = now(),
          reviewed_by_user_id = actor_user_id,
          updated_at = now()
      where ta.id = target_application_id;

      insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
      values (
        actor_user_id,
        'team_application.waitlist',
        'team_application',
        target_application_id,
        jsonb_build_object(
          'reason', nullif(btrim(review_reason), ''),
          'seasonId', application_row.season_id
        )
      );

      return query
      select ta.id, ta.status, ta.team_id, ta.slot_id, null::timestamptz
      from private.team_applications ta
      where ta.id = target_application_id;
      return;
    end if;

    select p.user_id into captain_user_id
    from public.players p where p.id = application_row.applicant_player_id;
    if captain_user_id is null then
      captain_user_id := actor_user_id;
    end if;

    if application_row.team_id is null then
      insert into public.teams (season_id, name, created_by)
      values (application_row.season_id, application_row.proposed_team_name, captain_user_id)
      returning id into inserted_team_id;

      insert into public.team_memberships (season_id, team_id, player_id, role)
      values (
        application_row.season_id,
        inserted_team_id,
        application_row.applicant_player_id,
        'captain'
      );
    else
      inserted_team_id := application_row.team_id;
    end if;

    target_hold_expires_at := now() + make_interval(days => coalesce(hold_days, 7));
    insert into private.season_team_slots (
      season_id, team_id, assigned_captain_player_id, status, hold_expires_at
    ) values (
      application_row.season_id,
      inserted_team_id,
      application_row.applicant_player_id,
      'approved_pending_roster',
      target_hold_expires_at
    )
    returning id into inserted_slot_id;

    update private.team_applications ta
    set status = 'approved_pending_roster',
        team_id = inserted_team_id,
        slot_id = inserted_slot_id,
        first_qualified_at = coalesce(ta.first_qualified_at, now()),
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

-- Promote when an active slot is released/expired (deterministic next waitlisted).
create or replace function private.promote_waitlist_after_slot_free()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_id uuid;
begin
  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status in ('released', 'expired')
     and old.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
  then
    select la.user_id into admin_id
    from private.league_admins la
    order by la.user_id
    limit 1;

    if admin_id is not null then
      perform public.promote_next_waitlisted_team(admin_id, new.season_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists promote_waitlist_after_slot_free on private.season_team_slots;
create trigger promote_waitlist_after_slot_free
after update of status on private.season_team_slots
for each row
execute function private.promote_waitlist_after_slot_free();

revoke all on function public.list_season_waitlist(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_my_team_application_waitlist_status(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_override_waitlist_order(uuid, uuid, integer, text) from public, anon, authenticated;
revoke all on function public.promote_next_waitlisted_team(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_review_team_application(uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function public.list_season_waitlist(uuid, uuid) to service_role;
grant execute on function public.get_my_team_application_waitlist_status(uuid, uuid) to service_role;
grant execute on function public.admin_override_waitlist_order(uuid, uuid, integer, text) to service_role;
grant execute on function public.promote_next_waitlisted_team(uuid, uuid) to service_role;
grant execute on function public.admin_review_team_application(uuid, uuid, text, text) to service_role;
