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
  )
  select * from in_season
  union all
  select * from returning_teams
  union all
  select * from new_teams
  order by candidate_kind, team_name;
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
    status,
    last_action_reason
  ) values (
    target_season_id,
    case when source_team.season_id = target_season_id then null else source_team.id end,
    assigned_team_id,
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

comment on function public.list_admin_season_team_candidates(uuid, uuid) is
  'Service-role-only league-admin read model for Returning, New, and In season team management.';
comment on function public.admin_add_team_to_season(uuid, uuid, uuid) is
  'Service-role-only audited league-admin team assignment. Returning teams get a new season team record without copying roster memberships.';
