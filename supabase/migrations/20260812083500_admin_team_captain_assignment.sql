create or replace function public.list_admin_team_captain_candidates(
  actor_user_id uuid,
  target_season_id uuid,
  target_team_id uuid
)
returns table(
  player_id uuid,
  display_name text,
  has_login boolean,
  has_phone boolean,
  rostered_on_team boolean,
  captain_team_id uuid,
  captain_team_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if not exists (
    select 1 from public.teams t
    where t.id = target_team_id and t.season_id = target_season_id
  ) then
    raise exception 'Team not found';
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.user_id is not null,
    nullif(btrim(pc.phone), '') is not null,
    exists (
      select 1 from public.team_memberships target_tm
      where target_tm.season_id = target_season_id
        and target_tm.team_id = target_team_id
        and target_tm.player_id = p.id
        and target_tm.ends_at is null
    ),
    captain_tm.team_id,
    captain_team.name
  from public.players p
  left join private.player_contacts pc on pc.player_id = p.id
  left join lateral (
    select tm.team_id
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = p.id
      and tm.role = 'captain'
      and tm.ends_at is null
    order by tm.starts_at desc
    limit 1
  ) captain_tm on true
  left join public.teams captain_team on captain_team.id = captain_tm.team_id
  order by
    exists (
      select 1 from public.team_memberships target_tm
      where target_tm.season_id = target_season_id
        and target_tm.team_id = target_team_id
        and target_tm.player_id = p.id
        and target_tm.ends_at is null
    ) desc,
    lower(p.display_name),
    p.id;
end;
$$;

create or replace function public.admin_assign_team_captain(
  actor_user_id uuid,
  target_season_id uuid,
  target_team_id uuid,
  target_player_id uuid
)
returns table(
  team_id uuid,
  player_id uuid,
  display_name text,
  has_login boolean,
  has_phone boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_season_status text;
  target_player public.players%rowtype;
  existing_captain_id uuid;
  existing_captain_team_id uuid;
  target_has_phone boolean;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;

  select s.status into target_season_status
  from public.seasons s
  where s.id = target_season_id
  for update;
  if not found then raise exception 'Season not found'; end if;
  if target_season_status not in ('draft', 'registration', 'active', 'playoffs') then
    raise exception 'Captain cannot be assigned after the season is complete';
  end if;

  if not exists (
    select 1 from public.teams t
    where t.id = target_team_id and t.season_id = target_season_id
  ) then
    raise exception 'Team not found';
  end if;

  select * into target_player
  from public.players p
  where p.id = target_player_id
  for update;
  if not found then raise exception 'Player not found'; end if;

  select tm.player_id into existing_captain_id
  from public.team_memberships tm
  where tm.season_id = target_season_id
    and tm.team_id = target_team_id
    and tm.role = 'captain'
    and tm.ends_at is null
  order by tm.starts_at desc
  limit 1
  for update;

  if existing_captain_id = target_player_id then
    select nullif(btrim(pc.phone), '') is not null into target_has_phone
    from private.player_contacts pc
    where pc.player_id = target_player_id;
    target_has_phone := coalesce(target_has_phone, false);
    return query select target_team_id, target_player.id, target_player.display_name,
      target_player.user_id is not null, target_has_phone;
    return;
  end if;
  if existing_captain_id is not null then
    raise exception 'Team already has an active captain. Use the captain change workflow.';
  end if;

  select tm.team_id into existing_captain_team_id
  from public.team_memberships tm
  where tm.season_id = target_season_id
    and tm.player_id = target_player_id
    and tm.role = 'captain'
    and tm.ends_at is null
  limit 1;
  if existing_captain_team_id is not null then
    raise exception 'Player already captains another team in this season';
  end if;

  select nullif(btrim(pc.phone), '') is not null into target_has_phone
  from private.player_contacts pc
  where pc.player_id = target_player_id;
  target_has_phone := coalesce(target_has_phone, false);

  if target_season_status in ('active', 'playoffs') and not target_has_phone then
    raise exception 'Phone number is required before assigning an active captain';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.team_id = target_team_id
      and tm.player_id = target_player_id
      and tm.ends_at is null
  ) then
    update public.team_memberships tm
    set role = 'captain'
    where tm.season_id = target_season_id
      and tm.team_id = target_team_id
      and tm.player_id = target_player_id
      and tm.ends_at is null;
  else
    insert into public.team_memberships(season_id, team_id, player_id, role)
    values(target_season_id, target_team_id, target_player_id, 'captain');
  end if;

  update private.season_team_slots sts
  set assigned_captain_player_id = target_player_id,
      updated_at = now()
  where sts.season_id = target_season_id
    and sts.team_id = target_team_id
    and sts.status in ('approved_pending_roster', 'ready', 'confirmed');

  perform private.refresh_team_slot_readiness(target_team_id);

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'team.admin_assign_captain',
    'team',
    target_team_id,
    jsonb_build_object(
      'seasonId', target_season_id,
      'playerId', target_player_id,
      'hasLogin', target_player.user_id is not null,
      'hasPhone', target_has_phone
    )
  );

  return query select target_team_id, target_player.id, target_player.display_name,
    target_player.user_id is not null, target_has_phone;
end;
$$;

create or replace function private.enforce_phone_for_active_captain_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  season_status text;
begin
  if new.role = 'captain' and new.ends_at is null then
    select s.status into season_status
    from public.seasons s
    where s.id = new.season_id;

    if season_status in ('active', 'playoffs') and not exists (
      select 1 from private.player_contacts pc
      where pc.player_id = new.player_id
        and nullif(btrim(pc.phone), '') is not null
    ) then
      raise exception 'Phone number is required before assigning an active captain';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_phone_for_active_captain_membership
  on public.team_memberships;
create trigger enforce_phone_for_active_captain_membership
before insert or update of role, ends_at on public.team_memberships
for each row execute function private.enforce_phone_for_active_captain_membership();

create or replace function private.enforce_captain_contact_before_season_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status in ('draft', 'registration') and new.status = 'active' and exists (
    select 1
    from private.season_team_slots sts
    where sts.season_id = new.id
      and sts.status = 'confirmed'
      and not exists (
        select 1
        from public.team_memberships tm
        join private.player_contacts pc on pc.player_id = tm.player_id
        where tm.season_id = new.id
          and tm.team_id = sts.team_id
          and tm.role = 'captain'
          and tm.ends_at is null
          and nullif(btrim(pc.phone), '') is not null
      )
  ) then
    raise exception 'Every confirmed team requires a captain with a phone number before publication';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_captain_contact_before_season_activation
  on public.seasons;
create trigger enforce_captain_contact_before_season_activation
before update of status on public.seasons
for each row execute function private.enforce_captain_contact_before_season_activation();

revoke all on function public.list_admin_team_captain_candidates(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.admin_assign_team_captain(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.list_admin_team_captain_candidates(uuid, uuid, uuid)
  to service_role;
grant execute on function public.admin_assign_team_captain(uuid, uuid, uuid, uuid)
  to service_role;

comment on function public.list_admin_team_captain_candidates(uuid, uuid, uuid) is
  'Service-role-only league-admin captain picker. Broad results expose contact readiness only, never phone values.';
comment on function public.admin_assign_team_captain(uuid, uuid, uuid, uuid) is
  'Service-role-only audited captain assignment. Draft/registration teams may prepare an unclaimed captain without phone; active captaincy requires private phone contact.';
