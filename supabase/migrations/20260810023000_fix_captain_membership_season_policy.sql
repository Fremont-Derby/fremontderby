drop policy if exists "Team creator can bootstrap own captain membership"
on public.team_memberships;

create policy "Team creator can bootstrap own captain membership"
on public.team_memberships for insert
to authenticated
with check (
  role = 'captain'
  and player_id = (select private.current_player_id())
  and exists (
    select 1
    from public.teams t
    where t.id = team_memberships.team_id
      and t.season_id = team_memberships.season_id
      and t.created_by = (select auth.uid())
  )
);

comment on policy "Team creator can bootstrap own captain membership"
on public.team_memberships is
  'Allows a team creator to create only their own captain membership for the same season as the target team.';
