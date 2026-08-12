create or replace function public.admin_create_prepared_team(
  actor_user_id uuid,
  target_season_id uuid,
  team_name text
)
returns table(
  id uuid,
  season_id uuid,
  name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_season public.seasons%rowtype;
  normalized_team_name text;
  inserted_team_id uuid;
begin
  if not exists (
    select 1 from private.league_admins la where la.user_id = actor_user_id
  ) then
    raise exception 'Actor is not a league admin';
  end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;

  normalized_team_name := btrim(team_name);
  if normalized_team_name is null or normalized_team_name = '' then
    raise exception 'team_name is required';
  end if;
  if char_length(normalized_team_name) > 80 then
    raise exception 'team_name must be 80 characters or fewer';
  end if;

  select * into target_season
  from public.seasons s
  where s.id = target_season_id
  for update;
  if not found then raise exception 'Season not found'; end if;
  if target_season.status not in ('draft', 'registration') then
    raise exception 'Teams can only be prepared before season publication';
  end if;

  if exists (
    select 1
    from public.teams t
    where lower(btrim(t.name)) = lower(normalized_team_name)
  ) then
    raise exception 'A team with this name already exists. Search Returning or New to reuse it.';
  end if;

  insert into public.teams(season_id, name, created_by)
  values (target_season_id, normalized_team_name, actor_user_id)
  returning public.teams.id into inserted_team_id;

  insert into private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
  values (
    actor_user_id,
    'team.admin_create_prepared',
    'team',
    inserted_team_id,
    jsonb_build_object(
      'seasonId', target_season_id,
      'teamName', normalized_team_name,
      'captainAssigned', false,
      'slotAssigned', false
    )
  );

  return query
  select t.id, t.season_id, t.name
  from public.teams t
  where t.id = inserted_team_id;
end;
$$;

revoke all on function public.admin_create_prepared_team(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.admin_create_prepared_team(uuid, uuid, text)
  to service_role;

comment on function public.admin_create_prepared_team(uuid, uuid, text) is
  'Service-role-only audited league-admin creation of a same-season prepared team. It creates no captain membership or season slot; assignment remains explicit.';
