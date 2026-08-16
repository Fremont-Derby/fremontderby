-- Captain-facing trade counterparty options: other teams in season + non-captain roster players.

create or replace function public.list_trade_counterparty_options(
  actor_user_id uuid,
  target_season_id uuid
)
returns table (
  team_id uuid,
  team_name text,
  players jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_player_id uuid;
begin
  if actor_user_id is null then
    raise exception 'actor_user_id is required';
  end if;
  if target_season_id is null then
    raise exception 'target_season_id is required';
  end if;

  select p.id into actor_player_id
  from public.players p
  where p.user_id = actor_user_id
  limit 1;

  if actor_player_id is null then
    raise exception 'Player profile is required';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.player_id = actor_player_id
      and tm.season_id = target_season_id
      and tm.role = 'captain'
      and tm.ends_at is null
  ) then
    raise exception 'Only an active captain can list trade counterparties';
  end if;

  return query
  select
    t.id as team_id,
    t.name as team_name,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'playerId', p.id,
          'displayName', p.display_name,
          'role', tm.role
        )
        order by p.display_name
      )
      from public.team_memberships tm
      join public.players p on p.id = tm.player_id
      where tm.team_id = t.id
        and tm.season_id = t.season_id
        and tm.ends_at is null
        and tm.role = 'player'
    ), '[]'::jsonb) as players
  from public.teams t
  where t.season_id = target_season_id
    and not exists (
      select 1
      from public.team_memberships mine
      where mine.team_id = t.id
        and mine.season_id = t.season_id
        and mine.player_id = actor_player_id
        and mine.role = 'captain'
        and mine.ends_at is null
    )
  order by t.name;
end;
$$;

revoke all on function public.list_trade_counterparty_options(uuid, uuid) from public, anon, authenticated;
grant execute on function public.list_trade_counterparty_options(uuid, uuid) to service_role;
