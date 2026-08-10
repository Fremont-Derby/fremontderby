create or replace function public.get_own_team_management(
  actor_user_id uuid
)
returns table (
  player_id uuid,
  captain_teams jsonb,
  invitations jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with actor_player as (
    select p.id
    from public.players p
    where p.user_id = actor_user_id
    limit 1
  )
  select
    ap.id as player_id,
    coalesce(captain_rows.captain_teams, '[]'::jsonb) as captain_teams,
    coalesce(invitation_rows.invitations, '[]'::jsonb) as invitations
  from actor_player ap
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'seasonId', t.season_id,
        'seasonName', s.name,
        'teamId', t.id,
        'teamName', t.name,
        'captainMembershipId', captain.id,
        'roster', coalesce(roster_rows.roster, '[]'::jsonb),
        'pendingInvitations', coalesce(pending_rows.pending_invitations, '[]'::jsonb)
      )
      order by s.name, t.name
    ) as captain_teams
    from public.team_memberships captain
    join public.teams t
      on t.id = captain.team_id
     and t.season_id = captain.season_id
    join public.seasons s
      on s.id = captain.season_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'membershipId', tm.id,
          'playerId', p.id,
          'displayName', p.display_name,
          'role', tm.role,
          'startsAt', tm.starts_at,
          'endsAt', tm.ends_at,
          'fargoRating', pr.fargo_rating,
          'ratingStatus', pr.rating_status
        )
        order by case when tm.role = 'captain' then 0 else 1 end, p.display_name
      ) as roster
      from public.team_memberships tm
      join public.players p
        on p.id = tm.player_id
      left join public.player_ratings pr
        on pr.player_id = p.id
      where tm.team_id = t.id
        and tm.season_id = t.season_id
        and tm.ends_at is null
    ) roster_rows on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'invitationId', ti.id,
          'playerId', p.id,
          'displayName', p.display_name,
          'status', ti.status,
          'createdAt', ti.created_at
        )
        order by ti.created_at
      ) as pending_invitations
      from private.team_invitations ti
      join public.players p
        on p.id = ti.invited_player_id
      where ti.team_id = t.id
        and ti.status = 'pending'
    ) pending_rows on true
    where captain.player_id = ap.id
      and captain.role = 'captain'
      and captain.ends_at is null
  ) captain_rows on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'invitationId', ti.id,
        'seasonId', ti.season_id,
        'seasonName', s.name,
        'teamId', t.id,
        'teamName', t.name,
        'status', ti.status,
        'createdAt', ti.created_at
      )
      order by ti.created_at
    ) as invitations
    from private.team_invitations ti
    join public.teams t
      on t.id = ti.team_id
     and t.season_id = ti.season_id
    join public.seasons s
      on s.id = ti.season_id
    where ti.invited_player_id = ap.id
      and ti.status = 'pending'
  ) invitation_rows on true;
$$;

revoke all on function public.get_own_team_management(uuid)
  from public, anon, authenticated;
grant execute on function public.get_own_team_management(uuid)
  to service_role;

comment on function public.get_own_team_management(uuid) is
  'Service-role-only team-management read model for the authenticated actor, including captained teams, active roster, pending outgoing invitations, and pending incoming invitations.';
