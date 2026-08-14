-- Fix SQL defects found by DRU no-auth probes (#615, #613, #616).
-- 1) admin_manage_team_slot: RETURNS TABLE columns shadowed bare slot_id / hold_expires_at.
-- 2) list_all_season_registration_internal: must not UPDATE (expire) on public read paths.
-- 3) Reinstall list_admin_season_team_candidates so candidate_kind is present.

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
    update private.season_team_slots as sts
    set status = 'confirmed', resolved_at = now(), updated_at = now()
    where sts.id = target_slot_id and sts.status in ('ready', 'approved_pending_roster');
    if not found then raise exception 'Team slot is not ready for confirmation'; end if;
    update private.team_applications as ta
    set status = 'confirmed', updated_at = now()
    where ta.slot_id = target_slot_id;
  elsif slot_action = 'extend' then
    if extension_days is null or extension_days not between 1 and 90 then
      raise exception 'extension_days must be between 1 and 90';
    end if;
    update private.season_team_slots as sts
    set hold_expires_at = greatest(coalesce(sts.hold_expires_at, now()), now())
          + make_interval(days => extension_days),
        last_action_reason = btrim(action_reason),
        updated_at = now()
    where sts.id = target_slot_id and sts.status in ('approved_pending_roster', 'ready');
    if not found then raise exception 'Only a roster hold can be extended'; end if;
  else
    update private.season_team_slots as sts
    set status = case when slot_action = 'release' then 'released' else 'expired' end,
        resolved_at = now(),
        last_action_reason = btrim(action_reason),
        updated_at = now()
    where sts.id = target_slot_id
      and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed');
    if not found then raise exception 'Team slot is no longer active'; end if;
    update private.team_applications as ta
    set status = case when slot_action = 'release' then 'deferred' else 'expired' end,
        updated_at = now()
    where ta.slot_id = target_slot_id
      and ta.status in ('approved_pending_roster', 'ready', 'confirmed');
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

revoke all on function public.admin_manage_team_slot(uuid, uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.admin_manage_team_slot(uuid, uuid, text, text, integer)
  to service_role;

create or replace function public.list_all_season_registration_internal()
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
  open_primary_roster_spots integer,
  at_risk_team_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
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
    )::integer,
    count(distinct sts.team_id) filter (
      where sts.team_id is not null and sts.status = 'confirmed'
    )::integer,
    count(distinct sts.id) filter (
      where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
    )::integer,
    greatest(0, s.team_capacity - count(distinct sts.id) filter (
      where sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
    ))::integer,
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
    (
      select coalesce(sum(greatest(0, 4 - (
        select count(*)
        from public.team_memberships spot_tm
        where spot_tm.team_id = spot_slot.team_id
          and spot_tm.ends_at is null
      ))), 0)::integer
      from private.season_team_slots spot_slot
      where spot_slot.season_id = s.id
        and spot_slot.team_id is not null
        and spot_slot.status in ('approved_pending_roster', 'ready', 'confirmed')
    ),
    count(distinct sts.team_id) filter (
      where sts.team_id is not null
        and sts.status in ('approved_pending_roster', 'ready')
        and (
          select count(*)
          from public.team_memberships risk_tm
          where risk_tm.team_id = sts.team_id
            and risk_tm.ends_at is null
        ) < s.minimum_committed_roster
    )::integer
  from public.seasons s
  left join private.season_team_slots sts on sts.season_id = s.id
  left join private.team_applications ta on ta.season_id = s.id
  left join public.team_memberships tm
    on tm.season_id = s.id and tm.ends_at is null
  left join public.season_players sp
    on sp.season_id = s.id
  group by s.id;
$$;

revoke all on function public.list_all_season_registration_internal()
  from public, anon, authenticated;
grant execute on function public.list_all_season_registration_internal()
  to service_role;

create or replace function public.list_admin_season_team_candidates(
  actor_user_id uuid,
  target_season_id uuid
)
returns table(
  candidate_kind text,
  team_id uuid,
  team_name text,
  source_season_id uuid,
  source_season_name text,
  captain_player_id uuid,
  captain_display_name text,
  active_roster_count integer,
  slot_status text
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
  if not exists (select 1 from public.seasons s where s.id = target_season_id) then
    raise exception 'Season not found';
  end if;

  perform private.expire_season_team_registration(target_season_id);

  return query
  with target_season as (
    select s.id, s.created_at
    from public.seasons s
    where s.id = target_season_id
  ),
  active_slots as (
    select sts.*
    from private.season_team_slots sts
    where sts.season_id = target_season_id
      and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
  ),
  in_season as (
    select
      'in_season'::text as candidate_kind,
      coalesce(slot.team_id, slot.source_team_id) as team_id,
      coalesce(current_team.name, source_team.name) as team_name,
      coalesce(current_team.season_id, source_team.season_id) as source_season_id,
      coalesce(current_season.name, source_season.name) as source_season_name,
      slot.assigned_captain_player_id as captain_player_id,
      captain.display_name as captain_display_name,
      case when slot.team_id is null then 0 else (
        select count(*)::integer
        from public.team_memberships tm
        where tm.team_id = slot.team_id
          and tm.season_id = target_season_id
          and tm.ends_at is null
      ) end as active_roster_count,
      slot.status as slot_status
    from active_slots slot
    left join public.teams current_team on current_team.id = slot.team_id
    left join public.teams source_team on source_team.id = slot.source_team_id
    left join public.seasons current_season on current_season.id = current_team.season_id
    left join public.seasons source_season on source_season.id = source_team.season_id
    left join public.players captain on captain.id = slot.assigned_captain_player_id
  ),
  new_teams as (
    select
      'new'::text as candidate_kind,
      t.id as team_id,
      t.name as team_name,
      t.season_id as source_season_id,
      s.name as source_season_name,
      captain_membership.player_id as captain_player_id,
      captain.display_name as captain_display_name,
      (
        select count(*)::integer
        from public.team_memberships roster
        where roster.team_id = t.id
          and roster.season_id = t.season_id
          and roster.ends_at is null
      ) as active_roster_count,
      null::text as slot_status
    from public.teams t
    join public.seasons s on s.id = t.season_id
    left join lateral (
      select tm.player_id
      from public.team_memberships tm
      where tm.team_id = t.id
        and tm.season_id = t.season_id
        and tm.role = 'captain'
        and tm.ends_at is null
      order by tm.starts_at desc
      limit 1
    ) captain_membership on true
    left join public.players captain on captain.id = captain_membership.player_id
    where t.season_id = target_season_id
      and not exists (
        select 1 from active_slots slot
        where slot.team_id = t.id or slot.source_team_id = t.id
      )
  ),
  returning_source as (
    select distinct on (lower(btrim(t.name)))
      t.id,
      t.name,
      t.season_id,
      s.name as season_name,
      s.created_at as season_created_at
    from public.teams t
    join public.seasons s on s.id = t.season_id
    join target_season target on s.created_at < target.created_at
    where t.season_id <> target_season_id
      and not exists (
        select 1 from public.teams target_team
        where target_team.season_id = target_season_id
          and lower(btrim(target_team.name)) = lower(btrim(t.name))
      )
      and not exists (
        select 1 from active_slots slot
        where slot.source_team_id = t.id
      )
    order by lower(btrim(t.name)), s.created_at desc, t.created_at desc
  ),
  returning_teams as (
    select
      'returning'::text as candidate_kind,
      source.id as team_id,
      source.name as team_name,
      source.season_id as source_season_id,
      source.season_name as source_season_name,
      captain_membership.player_id as captain_player_id,
      captain.display_name as captain_display_name,
      (
        select count(*)::integer
        from public.team_memberships roster
        where roster.team_id = source.id
          and roster.season_id = source.season_id
          and roster.ends_at is null
      ) as active_roster_count,
      null::text as slot_status
    from returning_source source
    left join lateral (
      select tm.player_id
      from public.team_memberships tm
      where tm.team_id = source.id
        and tm.season_id = source.season_id
        and tm.role = 'captain'
        and tm.ends_at is null
      order by tm.starts_at desc
      limit 1
    ) captain_membership on true
    left join public.players captain on captain.id = captain_membership.player_id
  ),
  combined as (
    select * from in_season
    union all
    select * from returning_teams
    union all
    select * from new_teams
  )
  select combined.*
  from combined
  order by combined.candidate_kind, combined.team_name;
end;
$$;

create or replace function public.admin_add_team_to_season(
  actor_user_id uuid,
  target_season_id uuid,
  candidate_team_id uuid
)
returns table(
  slot_id uuid,
  team_id uuid,
  team_name text,
  slot_status text,
  created_team boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_team public.teams%rowtype;
  target_season public.seasons%rowtype;
  assigned_team_id uuid;
  assigned_slot_id uuid;
  assigned_captain_player_id uuid;
  occupied_slots integer;
  created_new_team boolean := false;
  initial_status text;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if candidate_team_id is null then raise exception 'candidate_team_id is required'; end if;

  select * into target_season
  from public.seasons s
  where s.id = target_season_id
  for update;
  if not found then raise exception 'Season not found'; end if;
  if target_season.status not in ('draft', 'registration') then
    raise exception 'Teams can only be added before season publication';
  end if;

  select * into source_team
  from public.teams t
  where t.id = candidate_team_id;
  if not found then raise exception 'Team not found'; end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'season_team_capacity:' || target_season_id::text, 0
  ));
  perform private.expire_season_team_registration(target_season_id);

  select sts.id, sts.team_id
  into assigned_slot_id, assigned_team_id
  from private.season_team_slots sts
  where sts.season_id = target_season_id
    and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
    and (sts.team_id = candidate_team_id or sts.source_team_id = candidate_team_id)
  order by sts.created_at desc
  limit 1;

  if assigned_slot_id is not null then
    return query
    select sts.id,
           coalesce(sts.team_id, sts.source_team_id),
           coalesce(current_team.name, source_team_row.name),
           sts.status,
           false
    from private.season_team_slots sts
    left join public.teams current_team on current_team.id = sts.team_id
    left join public.teams source_team_row on source_team_row.id = sts.source_team_id
    where sts.id = assigned_slot_id;
    return;
  end if;

  select count(*)::integer into occupied_slots
  from private.season_team_slots sts
  where sts.season_id = target_season_id
    and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed');
  if occupied_slots >= target_season.team_capacity then
    raise exception 'No team slots are currently available';
  end if;

  if source_team.season_id = target_season_id then
    assigned_team_id := source_team.id;
  else
    select t.id into assigned_team_id
    from public.teams t
    where t.season_id = target_season_id
      and lower(btrim(t.name)) = lower(btrim(source_team.name))
    limit 1;

    if assigned_team_id is null then
      insert into public.teams(season_id, name, created_by)
      values (target_season_id, source_team.name, actor_user_id)
      returning public.teams.id into assigned_team_id;
      created_new_team := true;
    end if;
  end if;

  select sts.id into assigned_slot_id
  from private.season_team_slots sts
  where sts.season_id = target_season_id
    and sts.team_id = assigned_team_id
    and sts.status in ('reserved', 'transferred', 'approved_pending_roster', 'ready', 'confirmed')
  order by sts.created_at desc
  limit 1;
  if assigned_slot_id is not null then
    return query
    select sts.id, sts.team_id, target_team.name, sts.status, false
    from private.season_team_slots sts
    join public.teams target_team on target_team.id = sts.team_id
    where sts.id = assigned_slot_id;
    return;
  end if;

  select tm.player_id into assigned_captain_player_id
  from public.team_memberships tm
  where tm.team_id = assigned_team_id
    and tm.season_id = target_season_id
    and tm.role = 'captain'
    and tm.ends_at is null
  order by tm.starts_at desc
  limit 1;

  initial_status := case when (
    select count(*)
    from public.team_memberships tm
    where tm.team_id = assigned_team_id
      and tm.season_id = target_season_id
      and tm.ends_at is null
  ) >= target_season.minimum_committed_roster then 'ready' else 'approved_pending_roster' end;

  insert into private.season_team_slots(
    season_id,
    source_team_id,
    team_id,
    assigned_captain_player_id,
    status,
    last_action_reason
  ) values (
    target_season_id,
    case when source_team.season_id = target_season_id then null else source_team.id end,
    assigned_team_id,
    assigned_captain_player_id,
    initial_status,
    'Added manually by league admin'
  )
  returning private.season_team_slots.id into assigned_slot_id;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'season.admin_add_team',
    'season_team_slot',
    assigned_slot_id,
    jsonb_build_object(
      'seasonId', target_season_id,
      'sourceTeamId', source_team.id,
      'teamId', assigned_team_id,
      'teamName', source_team.name,
      'createdSeasonTeam', created_new_team,
      'copiedRoster', false,
      'status', initial_status
    )
  );

  return query
  select assigned_slot_id, assigned_team_id, source_team.name, initial_status, created_new_team;
end;
$$;

revoke all on function public.list_admin_season_team_candidates(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.admin_add_team_to_season(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.list_admin_season_team_candidates(uuid, uuid)
  to service_role;
grant execute on function public.admin_add_team_to_season(uuid, uuid, uuid)
  to service_role;


revoke all on function public.list_admin_season_team_candidates(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.list_admin_season_team_candidates(uuid, uuid)
  to service_role;

