create or replace function public.list_admin_players(actor_user_id uuid)
returns table (
  player_id uuid,
  display_name text,
  has_login boolean,
  is_league_admin boolean,
  teams jsonb
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
    ), '[]'::jsonb)
  from public.players p
  order by lower(p.display_name), p.id;
end;
$$;

create or replace function public.set_league_admin_role(
  actor_user_id uuid,
  target_player_id uuid,
  enabled boolean,
  change_reason text default null
)
returns table (
  player_id uuid,
  is_league_admin boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  was_admin boolean;
  normalized_reason text;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  if target_player_id is null then
    raise exception 'target_player_id is required';
  end if;
  if enabled is null then
    raise exception 'enabled is required';
  end if;

  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;

  select p.user_id into target_user_id
  from public.players p
  where p.id = target_player_id
  for update;

  if not found then
    raise exception 'Player not found';
  end if;
  if target_user_id is null then
    raise exception 'Player must sign in before admin access can be granted';
  end if;

  normalized_reason := nullif(btrim(change_reason), '');
  if normalized_reason is not null and char_length(normalized_reason) > 500 then
    raise exception 'reason must be 500 characters or fewer';
  end if;

  select exists (
    select 1 from private.league_admins la where la.user_id = target_user_id
  ) into was_admin;

  if enabled then
    insert into private.league_admins (user_id, granted_by, note)
    values (target_user_id, actor_user_id, normalized_reason)
    on conflict (user_id) do update
      set granted_by = excluded.granted_by,
          note = excluded.note;
  else
    if was_admin and (
      select count(*) from private.league_admins
    ) <= 1 then
      raise exception 'The last league admin cannot be removed';
    end if;
    delete from private.league_admins where user_id = target_user_id;
  end if;

  if was_admin is distinct from enabled then
    insert into private.audit_events (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      reason,
      before_state,
      after_state
    ) values (
      actor_user_id,
      case when enabled then 'player.grant_admin' else 'player.revoke_admin' end,
      'player',
      target_player_id,
      normalized_reason,
      jsonb_build_object('isLeagueAdmin', was_admin),
      jsonb_build_object('isLeagueAdmin', enabled)
    );
  end if;

  return query select target_player_id, enabled;
end;
$$;

revoke all on function public.list_admin_players(uuid) from public, anon, authenticated;
grant execute on function public.list_admin_players(uuid) to service_role;

revoke all on function public.set_league_admin_role(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.set_league_admin_role(uuid, uuid, boolean, text) to service_role;

comment on function public.list_admin_players(uuid) is
  'Service-role-only league-admin player directory for human-readable admin management.';
comment on function public.set_league_admin_role(uuid, uuid, boolean, text) is
  'Service-role-only audited league-admin grant/revoke command with last-admin protection.';
