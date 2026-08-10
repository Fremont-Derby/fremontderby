-- Supabase projects can include broad default table grants for API roles.
-- Reset them explicitly before applying Fremont Derby's least-privilege model.
revoke all on table
  public.players,
  public.player_ratings,
  public.seasons,
  public.teams,
  public.team_memberships
from anon, authenticated;

grant select on
  public.players,
  public.player_ratings,
  public.seasons,
  public.teams,
  public.team_memberships
to anon, authenticated;

grant insert (user_id, display_name) on public.players to authenticated;
grant update (display_name) on public.players to authenticated;
grant insert (season_id, name, created_by) on public.teams to authenticated;
grant insert (season_id, team_id, player_id, role) on public.team_memberships to authenticated;
