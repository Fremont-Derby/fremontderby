-- JFL-only QA support for #2184.
-- The dual-scorecard personas are ordinary active team members so they do not
-- violate the production captaincy invariant. Allow only these deterministic
-- JFL test identities to pass the scorecard-view gate for the team they are
-- actually rostered on. Normal users retain the existing player/captain rule.

create or replace function jfl_private.can_score_player_match(
  actor_user_id uuid,
  target_match jfl.player_matches
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from jfl.players p
      where p.user_id = actor_user_id
        and p.id in (target_match.player_a_id, target_match.player_b_id)
    )
    or exists (
      select 1
      from jfl.players p
      join jfl.team_memberships tm on tm.player_id = p.id
      where p.user_id = actor_user_id
        and tm.season_id = target_match.season_id
        and tm.team_id in (target_match.team_a_id, target_match.team_b_id)
        and tm.role = 'captain'
        and tm.ends_at is null
    )
    or (
      actor_user_id in (
        '18580000-0000-4000-8000-000000000002'::uuid,
        '18580000-0000-4000-8000-000000000003'::uuid
      )
      and exists (
        select 1
        from jfl.players p
        join jfl.team_memberships tm on tm.player_id = p.id
        join jfl.teams t on t.id = tm.team_id
        where p.user_id = actor_user_id
          and tm.season_id = target_match.season_id
          and tm.team_id in (target_match.team_a_id, target_match.team_b_id)
          and tm.ends_at is null
          and t.name in ('JFL QA Bank Shots', 'JFL QA Table Testers')
      )
    );
$$;
