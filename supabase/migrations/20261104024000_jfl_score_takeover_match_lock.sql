-- #3660 / #3288: serialize lazy expiry with claim/release and scoring writes.
-- JFL only. Preserve recipient eligibility, transition audit and private ACL.
-- Match must be locked BEFORE claim, including when reached through a state read.
create or replace function jfl_private.resolve_expired_score_takeover(
  target_player_match_id uuid,
  target_scoring_team_id uuid
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  claim jfl_private.player_match_score_claims%rowtype;
  target_match jfl.player_matches%rowtype;
  next_owner uuid;
begin
  select *
  into target_match
  from jfl.player_matches pm
  where pm.id=target_player_match_id
  for update;

  if not found then
    return;
  end if;

  select *
  into claim
  from jfl_private.player_match_score_claims c
  where c.player_match_id=target_player_match_id
    and c.scoring_team_id=target_scoring_team_id
  for update;

  if not found
    or claim.pending_requester_user_id is null
    or claim.pending_expires_at>now()
  then
    return;
  end if;

  next_owner:=claim.pending_requester_user_id;

  if not jfl_private.score_claim_actor_is_eligible(
    next_owner,
    target_match,
    target_scoring_team_id
  ) then
    update jfl_private.player_match_score_claims
    set pending_requester_user_id=null,
        pending_requested_at=null,
        pending_expires_at=null,
        last_transition_at=now()
    where player_match_id=target_player_match_id
      and scoring_team_id=target_scoring_team_id;

    insert into jfl_private.audit_events(
      actor_user_id,
      action,
      entity_type,
      entity_id,
      reason,
      before_state,
      after_state
    )
    values(
      null,
      'player_match.scorekeeper_takeover_ineligible',
      'player_match',
      target_player_match_id,
      'Expired takeover request was cleared because the requester is no longer eligible',
      jsonb_build_object(
        'scoringTeamId',target_scoring_team_id,
        'ownerUserId',claim.owner_user_id,
        'pendingRequesterUserId',next_owner,
        'pendingExpiresAt',claim.pending_expires_at
      ),
      jsonb_build_object(
        'scoringTeamId',target_scoring_team_id,
        'ownerUserId',claim.owner_user_id
      )
    );
    return;
  end if;

  update jfl_private.player_match_score_claims
  set owner_user_id=next_owner,
      claimed_at=now(),
      pending_requester_user_id=null,
      pending_requested_at=null,
      pending_expires_at=null,
      last_transition_at=now()
  where player_match_id=target_player_match_id
    and scoring_team_id=target_scoring_team_id;

  insert into jfl_private.audit_events(
    actor_user_id,
    action,
    entity_type,
    entity_id,
    reason,
    before_state,
    after_state
  )
  values(
    null,
    'player_match.scorekeeper_takeover_auto_transfer',
    'player_match',
    target_player_match_id,
    'Takeover request auto-transferred after 15 seconds without a response',
    jsonb_build_object(
      'scoringTeamId',target_scoring_team_id,
      'ownerUserId',claim.owner_user_id,
      'pendingRequesterUserId',claim.pending_requester_user_id,
      'pendingExpiresAt',claim.pending_expires_at
    ),
    jsonb_build_object(
      'scoringTeamId',target_scoring_team_id,
      'ownerUserId',next_owner
    )
  );
end;
$$;

revoke all on function jfl_private.resolve_expired_score_takeover(uuid,uuid) from public,anon,authenticated;
grant execute on function jfl_private.resolve_expired_score_takeover(uuid,uuid) to service_role;
