-- #414 — cancel / archive / safe-delete season lifecycle (distinct from close_season)

-- Expand allowed season statuses
alter table public.seasons
  drop constraint if exists seasons_status_check;

alter table public.seasons
  add constraint seasons_status_check
  check (status in ('draft', 'registration', 'active', 'playoffs', 'complete', 'cancelled', 'archived'));

-- Guard: only session-flagged admin commands may enter cancelled/archived
create or replace function private.guard_season_lifecycle_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'cancelled'
     and old.status is distinct from 'cancelled'
     and coalesce(current_setting('fremont.explicit_season_cancel', true), '') <> 'on' then
    new.status := old.status;
  end if;

  if new.status = 'archived'
     and old.status is distinct from 'archived'
     and coalesce(current_setting('fremont.explicit_season_archive', true), '') <> 'on' then
    new.status := old.status;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_season_lifecycle_status() from public, anon, authenticated;
grant execute on function private.guard_season_lifecycle_status() to service_role;

drop trigger if exists guard_season_lifecycle_status on public.seasons;
create trigger guard_season_lifecycle_status
before update of status on public.seasons
for each row
execute function private.guard_season_lifecycle_status();

create or replace function public.get_season_lifecycle_readiness(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  season_id uuid,
  season_status text,
  season_name text,
  team_count integer,
  membership_count integer,
  team_match_count integer,
  player_match_count integer,
  can_cancel boolean,
  can_archive boolean,
  can_safe_delete boolean,
  cancel_reason text,
  archive_reason text,
  delete_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  current_name text;
  teams_n integer;
  members_n integer;
  team_matches_n integer;
  player_matches_n integer;
  meaningful boolean;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  select s.status, s.name into current_status, current_name
  from public.seasons s
  where s.id = target_season_id;

  if current_status is null then
    raise exception 'Season not found';
  end if;

  select count(*)::integer into teams_n from public.teams t where t.season_id = target_season_id;
  select count(*)::integer into members_n from public.team_memberships tm where tm.season_id = target_season_id;
  select count(*)::integer into team_matches_n from public.team_matches tm
    join public.rounds r on r.id = tm.round_id where r.season_id = target_season_id;
  select count(*)::integer into player_matches_n from public.player_matches pm where pm.season_id = target_season_id;

  meaningful := (teams_n > 0 or members_n > 0 or team_matches_n > 0 or player_matches_n > 0);

  return query
  select
    target_season_id,
    current_status,
    current_name,
    teams_n,
    members_n,
    team_matches_n,
    player_matches_n,
    (current_status in ('draft', 'registration', 'active', 'playoffs')),
    (current_status in ('complete', 'cancelled')),
    (current_status = 'draft' and not meaningful),
    case
      when current_status in ('complete', 'cancelled', 'archived') then 'Season is already finished or archived.'
      when current_status in ('draft', 'registration', 'active', 'playoffs') then 'Ready to cancel with an explicit reason.'
      else 'Cancel is not available for this status.'
    end,
    case
      when current_status in ('complete', 'cancelled') then 'Ready to archive for historical visibility.'
      when current_status = 'archived' then 'Season is already archived.'
      else 'Archive only after close or cancel.'
    end,
    case
      when current_status <> 'draft' then 'Safe delete is only for empty draft seasons.'
      when meaningful then 'Season has teams, memberships, or matches — cancel or archive instead of delete.'
      else 'Empty draft season may be safely deleted.'
    end;
end;
$$;

create or replace function public.cancel_season(
  actor_user_id uuid,
  target_season_id uuid,
  cancel_reason text
)
returns table(
  season_id uuid,
  season_status text,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  readiness record;
  effective_at timestamptz := now();
  reason_text text := nullif(trim(coalesce(cancel_reason, '')), '');
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if reason_text is null or char_length(reason_text) < 3 then
    raise exception 'Cancel reason is required (at least 3 characters)';
  end if;

  perform 1 from public.seasons s where s.id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;

  select * into readiness from public.get_season_lifecycle_readiness(actor_user_id, target_season_id);

  if readiness.season_status = 'cancelled' then
    return query select target_season_id, 'cancelled'::text, effective_at;
    return;
  end if;

  if not readiness.can_cancel then
    raise exception '%', readiness.cancel_reason;
  end if;

  perform set_config('fremont.explicit_season_cancel', 'on', true);

  update public.seasons
  set status = 'cancelled', updated_at = effective_at
  where id = target_season_id;

  insert into private.audit_events(
    actor_user_id, action, entity_type, entity_id, after_state
  ) values (
    actor_user_id,
    'season.cancel',
    'season',
    target_season_id,
    jsonb_build_object(
      'status', 'cancelled',
      'reason', reason_text,
      'cancelledAt', effective_at,
      'previousStatus', readiness.season_status
    )
  );

  return query select target_season_id, 'cancelled'::text, effective_at;
end;
$$;

create or replace function public.archive_season(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  season_id uuid,
  season_status text,
  archived_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  readiness record;
  effective_at timestamptz := now();
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;

  perform 1 from public.seasons s where s.id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;

  select * into readiness from public.get_season_lifecycle_readiness(actor_user_id, target_season_id);

  if readiness.season_status = 'archived' then
    return query select target_season_id, 'archived'::text, effective_at;
    return;
  end if;

  if not readiness.can_archive then
    raise exception '%', readiness.archive_reason;
  end if;

  perform set_config('fremont.explicit_season_archive', 'on', true);

  update public.seasons
  set status = 'archived', updated_at = effective_at
  where id = target_season_id;

  insert into private.audit_events(
    actor_user_id, action, entity_type, entity_id, after_state
  ) values (
    actor_user_id,
    'season.archive',
    'season',
    target_season_id,
    jsonb_build_object(
      'status', 'archived',
      'archivedAt', effective_at,
      'previousStatus', readiness.season_status
    )
  );

  return query select target_season_id, 'archived'::text, effective_at;
end;
$$;

create or replace function public.safe_delete_season(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  season_id uuid,
  deleted boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  readiness record;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;

  perform 1 from public.seasons s where s.id = target_season_id for update;
  if not found then raise exception 'Season not found'; end if;

  select * into readiness from public.get_season_lifecycle_readiness(actor_user_id, target_season_id);

  if not readiness.can_safe_delete then
    raise exception '%', readiness.delete_reason;
  end if;

  insert into private.audit_events(
    actor_user_id, action, entity_type, entity_id, after_state
  ) values (
    actor_user_id,
    'season.safe_delete',
    'season',
    target_season_id,
    jsonb_build_object(
      'deleted', true,
      'previousStatus', readiness.season_status,
      'seasonName', readiness.season_name
    )
  );

  delete from public.seasons where id = target_season_id;

  return query select target_season_id, true;
end;
$$;

revoke all on function public.get_season_lifecycle_readiness(uuid, uuid) from public, anon, authenticated;
revoke all on function public.cancel_season(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.archive_season(uuid, uuid) from public, anon, authenticated;
revoke all on function public.safe_delete_season(uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_season_lifecycle_readiness(uuid, uuid) to service_role;
grant execute on function public.cancel_season(uuid, uuid, text) to service_role;
grant execute on function public.archive_season(uuid, uuid) to service_role;
grant execute on function public.safe_delete_season(uuid, uuid) to service_role;

comment on function public.cancel_season(uuid, uuid, text) is
  'Service-role league-admin cancel with required reason; preserves history; not close.';
comment on function public.archive_season(uuid, uuid) is
  'Service-role league-admin archive for historical visibility after close/cancel.';
comment on function public.safe_delete_season(uuid, uuid) is
  'Service-role league-admin hard-delete only empty draft seasons with no dependents.';
