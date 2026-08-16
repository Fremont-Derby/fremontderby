-- Admin audit feed + ensure moderation/broadcast land in private.audit_events.
-- Optional outbound webhook queue for near-real-time consumers.

create table if not exists private.audit_webhook_outbox (
  id uuid primary key default gen_random_uuid(),
  audit_event_id uuid not null references private.audit_events(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  attempts integer not null default 0,
  last_error text
);

create index if not exists audit_webhook_outbox_pending_idx
  on private.audit_webhook_outbox (created_at)
  where delivered_at is null;

revoke all on table private.audit_webhook_outbox from public, anon, authenticated;
grant all on table private.audit_webhook_outbox to service_role;

create or replace function private.enqueue_audit_webhook()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.audit_webhook_outbox (audit_event_id, payload)
  values (
    new.id,
    jsonb_build_object(
      'id', new.id,
      'actorUserId', new.actor_user_id,
      'action', new.action,
      'entityType', new.entity_type,
      'entityId', new.entity_id,
      'reason', new.reason,
      'beforeState', new.before_state,
      'afterState', new.after_state,
      'createdAt', new.created_at
    )
  );
  return new;
end;
$$;

drop trigger if exists audit_events_enqueue_webhook on private.audit_events;
create trigger audit_events_enqueue_webhook
  after insert on private.audit_events
  for each row
  execute function private.enqueue_audit_webhook();

create or replace function public.list_admin_audit_events(
  actor_user_id uuid,
  result_limit integer default 50,
  action_prefix text default null
)
returns table (
  id uuid,
  actor_user_id uuid,
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
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'League admin access is required';
  end if;

  return query
  select
    e.id,
    e.actor_user_id,
    coalesce(p.display_name, left(e.actor_user_id::text, 8)) as actor_display_name,
    e.action,
    e.entity_type,
    e.entity_id,
    e.reason,
    e.before_state,
    e.after_state,
    e.created_at
  from private.audit_events e
  left join public.players p on p.user_id = e.actor_user_id
  where cleaned_prefix is null
    or e.action like cleaned_prefix || '%'
  order by e.created_at desc
  limit lim;
end;
$$;

create or replace function public.claim_audit_webhook_batch(
  actor_user_id uuid,
  batch_size integer default 25
)
returns table (
  outbox_id uuid,
  audit_event_id uuid,
  payload jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'League admin access is required';
  end if;

  return query
  with picked as (
    select o.id
    from private.audit_webhook_outbox o
    where o.delivered_at is null
    order by o.created_at asc
    limit greatest(1, least(coalesce(batch_size, 25), 100))
    for update skip locked
  )
  select o.id, o.audit_event_id, o.payload, o.created_at
  from private.audit_webhook_outbox o
  join picked p on p.id = o.id
  order by o.created_at asc;
end;
$$;

create or replace function public.mark_audit_webhook_delivered(
  actor_user_id uuid,
  target_outbox_id uuid,
  delivery_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'League admin access is required';
  end if;

  if delivery_error is null then
    update private.audit_webhook_outbox
    set delivered_at = now(),
        attempts = attempts + 1,
        last_error = null
    where id = target_outbox_id;
  else
    update private.audit_webhook_outbox
    set attempts = attempts + 1,
        last_error = left(delivery_error, 500)
    where id = target_outbox_id;
  end if;
  return found;
end;
$$;

-- Patch chat moderation to write audit_events when resolving reports / removing messages.
-- Re-read current moderate function and wrap audit insert via a helper used from Worker if SQL form varies.
create or replace function public.write_admin_audit_event(
  actor_user_id uuid,
  audit_action text,
  audit_entity_type text,
  audit_entity_id uuid,
  audit_reason text default null,
  audit_before jsonb default null,
  audit_after jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  if nullif(btrim(coalesce(audit_action, '')), '') is null then
    raise exception 'audit_action is required';
  end if;
  if nullif(btrim(coalesce(audit_entity_type, '')), '') is null then
    raise exception 'audit_entity_type is required';
  end if;
  if audit_entity_id is null then
    raise exception 'audit_entity_id is required';
  end if;

  insert into private.audit_events (
    actor_user_id, action, entity_type, entity_id, reason, before_state, after_state
  ) values (
    actor_user_id,
    btrim(audit_action),
    btrim(audit_entity_type),
    audit_entity_id,
    nullif(btrim(coalesce(audit_reason, '')), ''),
    audit_before,
    audit_after
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.list_admin_audit_events(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.list_admin_audit_events(uuid, integer, text) to service_role;
revoke all on function public.claim_audit_webhook_batch(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_audit_webhook_batch(uuid, integer) to service_role;
revoke all on function public.mark_audit_webhook_delivered(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.mark_audit_webhook_delivered(uuid, uuid, text) to service_role;
revoke all on function public.write_admin_audit_event(uuid, text, text, uuid, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.write_admin_audit_event(uuid, text, text, uuid, text, jsonb, jsonb) to service_role;
