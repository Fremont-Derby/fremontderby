create or replace function public.list_admin_players_for_management(actor_user_id uuid)
returns table (
  player_id uuid,
  display_name text,
  has_login boolean,
  is_league_admin boolean,
  teams jsonb,
  current_season_id uuid,
  current_season_name text,
  registration_status text,
  payment_status text,
  competition_eligible boolean,
  ineligibility_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_season public.seasons%rowtype;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  select * into active_season
  from public.seasons s
  where s.status <> 'complete'
  order by s.created_at desc, s.id desc
  limit 1;

  return query
  select
    p.id,
    p.display_name,
    p.user_id is not null,
    exists (
      select 1 from private.league_admins la where la.user_id = p.user_id
    ),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'membershipId', tm.id,
          'teamId', t.id,
          'teamName', t.name,
          'seasonId', s.id,
          'seasonName', s.name,
          'role', tm.role
        ) order by s.created_at desc, t.name
      )
      from public.team_memberships tm
      join public.teams t on t.id = tm.team_id
      join public.seasons s on s.id = tm.season_id
      where tm.player_id = p.id
        and tm.ends_at is null
    ), '[]'::jsonb),
    active_season.id,
    active_season.name,
    (
      select sp.status
      from public.season_players sp
      where sp.season_id = active_season.id and sp.player_id = p.id
      limit 1
    ),
    (
      select ps.status
      from private.payment_status ps
      where ps.season_id = active_season.id and ps.player_id = p.id
      limit 1
    ),
    not exists (
      select 1
      from private.player_competition_restrictions r
      where r.season_id = active_season.id
        and r.player_id = p.id
        and r.lifted_at is null
    ),
    (
      select r.reason
      from private.player_competition_restrictions r
      where r.season_id = active_season.id
        and r.player_id = p.id
        and r.lifted_at is null
      limit 1
    )
  from public.players p
  order by lower(p.display_name), p.id;
end;
$$;

create or replace function public.list_admin_roster_teams(actor_user_id uuid)
returns table (
  season_id uuid,
  season_name text,
  team_id uuid,
  team_name text
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
    raise exception 'Actor is not a league admin';
  end if;

  return query
  select s.id, s.name, t.id, t.name
  from public.seasons s
  join public.teams t on t.season_id = s.id
  where s.status <> 'complete'
  order by s.created_at desc, lower(t.name), t.id;
end;
$$;

create or replace function public.set_admin_player_team_membership(
  actor_user_id uuid,
  target_season_id uuid,
  target_team_id uuid,
  target_player_id uuid,
  active boolean,
  change_reason text default null
)
returns table (
  membership_id uuid,
  season_id uuid,
  team_id uuid,
  player_id uuid,
  role text,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_team public.teams%rowtype;
  membership public.team_memberships%rowtype;
  normalized_reason text;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  if target_team_id is null then raise exception 'target_team_id is required'; end if;
  if target_player_id is null then raise exception 'target_player_id is required'; end if;
  if active is null then raise exception 'active is required'; end if;

  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then raise exception 'Actor is not a league admin'; end if;

  select * into target_team
  from public.teams t
  where t.id = target_team_id
    and t.season_id = target_season_id;
  if not found then raise exception 'Team not found in season'; end if;

  if not exists (select 1 from public.players p where p.id = target_player_id) then
    raise exception 'Player not found';
  end if;

  normalized_reason := nullif(btrim(change_reason), '');
  if normalized_reason is not null and char_length(normalized_reason) > 500 then
    raise exception 'reason must be 500 characters or fewer';
  end if;

  select * into membership
  from public.team_memberships tm
  where tm.season_id = target_season_id
    and tm.team_id = target_team_id
    and tm.player_id = target_player_id
    and tm.ends_at is null
  for update;

  if active then
    if not found then
      insert into public.team_memberships(season_id, team_id, player_id, role)
      values (target_season_id, target_team_id, target_player_id, 'player')
      returning * into membership;

      insert into private.audit_events(
        actor_user_id, action, entity_type, entity_id, reason, before_state, after_state
      ) values (
        actor_user_id,
        'player.admin_add_team_membership',
        'team_membership',
        membership.id,
        normalized_reason,
        jsonb_build_object(
          'seasonId', target_season_id,
          'teamId', target_team_id,
          'playerId', target_player_id,
          'active', false
        ),
        jsonb_build_object(
          'seasonId', target_season_id,
          'teamId', target_team_id,
          'playerId', target_player_id,
          'role', membership.role,
          'active', true
        )
      );
    end if;
  else
    if not found then
      raise exception 'Active team membership not found';
    end if;
    if membership.role = 'captain' then
      raise exception 'Captain memberships require the captain lifecycle workflow';
    end if;

    update public.team_memberships tm
    set ends_at = now()
    where tm.id = membership.id
    returning * into membership;

    insert into private.audit_events(
      actor_user_id, action, entity_type, entity_id, reason, before_state, after_state
    ) values (
      actor_user_id,
      'player.admin_remove_team_membership',
      'team_membership',
      membership.id,
      normalized_reason,
      jsonb_build_object(
        'seasonId', target_season_id,
        'teamId', target_team_id,
        'playerId', target_player_id,
        'role', membership.role,
        'active', true
      ),
      jsonb_build_object(
        'seasonId', target_season_id,
        'teamId', target_team_id,
        'playerId', target_player_id,
        'role', membership.role,
        'active', false,
        'endsAt', membership.ends_at
      )
    );
  end if;

  return query
  select membership.id, membership.season_id, membership.team_id,
         membership.player_id, membership.role, membership.ends_at;
end;
$$;

revoke all on function public.list_admin_roster_teams(uuid)
  from public, anon, authenticated;
grant execute on function public.list_admin_roster_teams(uuid) to service_role;

revoke all on function public.set_admin_player_team_membership(uuid, uuid, uuid, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.set_admin_player_team_membership(uuid, uuid, uuid, uuid, boolean, text)
  to service_role;

comment on function public.list_admin_roster_teams(uuid) is
  'Service-role-only league-admin read model for human-readable active-season team choices.';
comment on function public.set_admin_player_team_membership(uuid, uuid, uuid, uuid, boolean, text) is
  'Service-role-only audited league-admin exception for adding or ending one player team membership without rewriting history or unrelated memberships.';