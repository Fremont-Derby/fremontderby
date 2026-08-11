-- A player may roster on multiple teams, but may captain only one active team per season.
-- Reuse the captain lifecycle index already present on main rather than maintaining a duplicate.

drop index if exists public.one_active_captaincy_per_season;

create unique index if not exists one_active_captain_team_per_season
  on public.team_memberships (season_id, player_id)
  where role = 'captain' and ends_at is null;

create or replace function public.create_team_with_captain(
  actor_user_id uuid,
  target_season_id uuid,
  team_name text
)
returns table(id uuid, season_id uuid, name text, captain_player_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
  inserted_team_id uuid;
  normalized_team_name text;
begin
  if actor_user_id is null then raise exception 'actor_user_id is required'; end if;
  if target_season_id is null then raise exception 'target_season_id is required'; end if;
  normalized_team_name := btrim(team_name);
  if normalized_team_name is null or char_length(normalized_team_name) = 0 then
    raise exception 'team_name is required';
  end if;
  if char_length(normalized_team_name) > 80 then
    raise exception 'team_name must be 80 characters or fewer';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id;
  if not found then raise exception 'Player profile is required before creating a team'; end if;

  if exists (
    select 1
    from public.team_memberships tm
    where tm.season_id = target_season_id
      and tm.player_id = actor_player_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'You already captain a team in this season and cannot create another';
  end if;

  insert into public.teams (season_id, name, created_by)
  values (target_season_id, normalized_team_name, actor_user_id)
  returning teams.id into inserted_team_id;

  insert into public.team_memberships (season_id, team_id, player_id, role)
  values (target_season_id, inserted_team_id, actor_player_id, 'captain');

  return query
  select t.id, t.season_id, t.name, actor_player_id
  from public.teams t
  where t.id = inserted_team_id;
end;
$$;

revoke all on function public.create_team_with_captain(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.create_team_with_captain(uuid, uuid, text) to service_role;