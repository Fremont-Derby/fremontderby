create role anon; create role authenticated; create role service_role; create schema auth; create schema jfl; create schema jfl_private;
create table auth.users(id uuid primary key);
create table jfl_private.league_admins(user_id uuid primary key references auth.users);
create table jfl.seasons(id uuid primary key,status text);
create table jfl.teams(id uuid primary key default gen_random_uuid(),season_id uuid references jfl.seasons,name text,created_by uuid references auth.users);
create table jfl_private.audit_events(id uuid primary key default gen_random_uuid(),actor_user_id uuid,action text,entity_type text,entity_id uuid,after_state jsonb);
CREATE OR REPLACE FUNCTION jfl.admin_create_prepared_team(actor_user_id uuid, target_season_id uuid, team_name text)
 RETURNS TABLE(id uuid, season_id uuid, name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  target_season jfl.seasons%rowtype;
  normalized_team_name text;
  inserted_team_id uuid;
begin
  if not exists (
    select 1 from jfl_private.league_admins la where la.user_id = actor_user_id
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
  from jfl.seasons s
  where s.id = target_season_id
  for update;
  if not found then raise exception 'Season not found'; end if;
  if target_season.status not in ('draft', 'registration') then
    raise exception 'Teams can only be prepared before season publication';
  end if;

  if exists (
    select 1
    from jfl.teams t
    where lower(btrim(t.name)) = lower(normalized_team_name)
  ) then
    raise exception 'A team with this name already exists. Search Returning or New to reuse it.';
  end if;

  insert into jfl.teams(season_id, name, created_by)
  values (target_season_id, normalized_team_name, actor_user_id)
  returning jfl.teams.id into inserted_team_id;

  insert into jfl_private.audit_events(actor_user_id, action, entity_type, entity_id, after_state)
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
  from jfl.teams t
  where t.id = inserted_team_id;
end;
$function$;

