create or replace function public.create_team_with_captain(
  actor_user_id uuid,
  target_season_id uuid,
  team_name text
)
returns table (
  id uuid,
  season_id uuid,
  name text,
  captain_player_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  inserted_team_id uuid;
  normalized_team_name text;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;

  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  normalized_team_name := btrim(team_name);
  if normalized_team_name is null or char_length(normalized_team_name) = 0 then
    raise exception 'team_name is required';
  end if;

  if char_length(normalized_team_name) > 80 then
    raise exception 'team_name must be 80 characters or fewer';
  end if;

  select p.id
    into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;

  if not found then
    raise exception 'Player profile is required before creating a team';
  end if;

  insert into public.teams (
    season_id,
    name,
    created_by
  ) values (
    target_season_id,
    normalized_team_name,
    actor_user_id
  )
  returning teams.id into inserted_team_id;

  insert into public.team_memberships (
    season_id,
    team_id,
    player_id,
    role
  ) values (
    target_season_id,
    inserted_team_id,
    actor_player_id,
    'captain'
  );

  return query
  select
    t.id,
    t.season_id,
    t.name,
    actor_player_id
  from public.teams t
  where t.id = inserted_team_id;
end;
$$;

revoke all on function public.create_team_with_captain(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_team_with_captain(uuid, uuid, text)
  to service_role;

comment on function public.create_team_with_captain(uuid, uuid, text) is
  'Service-role-only team creation boundary. The authenticated actor must already have a player profile and becomes captain.';
