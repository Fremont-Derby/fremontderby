create or replace function private.match_player_for_user(
  actor_user_id uuid,
  target_match public.player_matches
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with actor as (
    select p.id
    from public.players p
    where p.user_id = actor_user_id
    limit 1
  ), active_match_memberships as (
    select distinct tm.team_id
    from public.team_memberships tm
    join actor a on a.id = tm.player_id
    where tm.ends_at is null
      and tm.team_id in (target_match.team_a_id, target_match.team_b_id)
  )
  select case
    when coalesce(bool_or(team_id = target_match.team_a_id), false)
      and not coalesce(bool_or(team_id = target_match.team_b_id), false)
      then target_match.player_a_id
    when coalesce(bool_or(team_id = target_match.team_b_id), false)
      and not coalesce(bool_or(team_id = target_match.team_a_id), false)
      then target_match.player_b_id
    else null
  end
  from active_match_memberships;
$$;

revoke all on function private.match_player_for_user(uuid, public.player_matches) from public;

comment on function private.match_player_for_user(uuid, public.player_matches) is
  'Resolves an authenticated scorer to the active player slot owned by their current team. Any active teammate may maintain that team side of the dual score; opposing or unrelated players resolve to null.';

comment on table private.player_match_score_submissions is
  'One independent rack history per side of a player match. tracker_player_id identifies the active match participant whose team owns the history; any authenticated active teammate on that team may maintain it through trusted RPCs.';

comment on function public.record_player_match_score_rack(uuid, uuid, text) is
  'Service-role-only boundary allowing an authenticated active teammate to append one rack only to their own team side of a player match score history.';

comment on function public.undo_player_match_score_rack(uuid, uuid) is
  'Service-role-only boundary allowing an authenticated active teammate to undo only the latest rack on their own team side of an unfinalized score history.';

comment on function public.confirm_player_match_score(uuid, uuid) is
  'Service-role-only boundary allowing an authenticated active teammate to confirm only their own team side of the completed score history.';

comment on function public.get_player_match_score_comparison(uuid, uuid) is
  'Service-role-only comparison of both team-maintained score histories. The caller may view both histories but their editable tracker side is resolved strictly from active team membership.';

comment on function public.finalize_reconciled_player_match(uuid, uuid) is
  'Service-role-only atomic finalizer callable by an authenticated member of either participating team after both team-owned histories match and are confirmed.';
