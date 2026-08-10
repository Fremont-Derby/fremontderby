create or replace function public.get_own_player_profile(
  actor_user_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  fargo_rating integer,
  rating_status text,
  teams jsonb,
  seasons jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.user_id,
    p.display_name,
    pr.fargo_rating,
    pr.rating_status,
    coalesce(team_rows.teams, '[]'::jsonb) as teams,
    coalesce(season_rows.seasons, '[]'::jsonb) as seasons
  from public.players p
  left join public.player_ratings pr
    on pr.player_id = p.id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'seasonId', tm.season_id,
        'seasonName', s.name,
        'teamId', tm.team_id,
        'teamName', t.name,
        'role', tm.role,
        'startsAt', tm.starts_at,
        'endsAt', tm.ends_at
      )
      order by s.name, t.name, tm.starts_at
    ) as teams
    from public.team_memberships tm
    join public.teams t
      on t.id = tm.team_id
     and t.season_id = tm.season_id
    join public.seasons s
      on s.id = tm.season_id
    where tm.player_id = p.id
  ) team_rows on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'seasonId', sp.season_id,
        'seasonName', s.name,
        'participationType', sp.participation_type,
        'status', sp.status
      )
      order by s.name, sp.participation_type
    ) as seasons
    from public.season_players sp
    join public.seasons s
      on s.id = sp.season_id
    where sp.player_id = p.id
  ) season_rows on true
  where p.user_id = actor_user_id
  limit 1;
$$;

revoke all on function public.get_own_player_profile(uuid)
  from public, anon, authenticated;
grant execute on function public.get_own_player_profile(uuid)
  to service_role;

comment on function public.get_own_player_profile(uuid) is
  'Service-role-only profile read model for the authenticated actor, including public rating, team membership, and season participation summaries.';
