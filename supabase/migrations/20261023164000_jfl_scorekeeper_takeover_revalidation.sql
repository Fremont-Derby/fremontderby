-- Forward-only repair for environments where the original claim migration was
-- applied before eligibility revalidation was added to its source file.
-- Issue #3288: a takeover recipient must still be eligible at transfer time.

create or replace function jfl_private.score_claim_actor_is_eligible(
  actor_user_id uuid,
  target_match jfl.player_matches,
  target_scoring_team_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  perform jfl_private.require_score_claim_actor(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  return true;
exception when raise_exception then
  return false;
end;
$$;

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
  where pm.id=target_player_match_id;

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

create or replace function jfl.respond_player_match_score_takeover(
  actor_user_id uuid,
  target_player_match_id uuid,
  target_scoring_team_id uuid,
  decision text
)
returns setof jfl_private.player_match_score_claim_state
language plpgsql
security definer
set search_path=''
as $$
declare
  target_match jfl.player_matches%rowtype;
  claim jfl_private.player_match_score_claims%rowtype;
  next_owner uuid;
begin
  if decision not in ('release','deny') then
    raise exception 'decision must be release or deny';
  end if;

  select *
  into target_match
  from jfl.player_matches pm
  where pm.id=target_player_match_id
  for update;

  if not found then
    raise exception 'Player match not found';
  end if;

  perform jfl_private.require_score_claim_actor(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform jfl_private.resolve_expired_score_takeover(
    target_player_match_id,
    target_scoring_team_id
  );

  select *
  into claim
  from jfl_private.player_match_score_claims c
  where c.player_match_id=target_player_match_id
    and c.scoring_team_id=target_scoring_team_id
  for update;

  if not found or claim.owner_user_id<>actor_user_id then
    raise exception 'Only the current scorekeeper can respond to takeover';
  end if;

  if claim.pending_requester_user_id is null then
    raise exception 'No scorekeeping takeover request is pending';
  end if;

  if decision='release' then
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
        actor_user_id,
        'player_match.scorekeeper_takeover_ineligible',
        'player_match',
        target_player_match_id,
        'Takeover release was cancelled because the requester is no longer eligible',
        jsonb_build_object(
          'scoringTeamId',target_scoring_team_id,
          'ownerUserId',claim.owner_user_id,
          'pendingRequesterUserId',next_owner
        ),
        jsonb_build_object(
          'scoringTeamId',target_scoring_team_id,
          'ownerUserId',claim.owner_user_id
        )
      );

      return query
      select *
      from jfl.get_player_match_score_claim(
        actor_user_id,
        target_player_match_id,
        target_scoring_team_id
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
  else
    next_owner:=actor_user_id;

    update jfl_private.player_match_score_claims
    set pending_requester_user_id=null,
        pending_requested_at=null,
        pending_expires_at=null,
        last_transition_at=now()
    where player_match_id=target_player_match_id
      and scoring_team_id=target_scoring_team_id;
  end if;

  insert into jfl_private.audit_events(
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_state
  )
  values(
    actor_user_id,
    case
      when decision='release' then 'player_match.scorekeeper_takeover_release'
      else 'player_match.scorekeeper_takeover_deny'
    end,
    'player_match',
    target_player_match_id,
    jsonb_build_object(
      'scoringTeamId',target_scoring_team_id,
      'requesterUserId',claim.pending_requester_user_id,
      'ownerUserId',next_owner
    )
  );

  return query
  select *
  from jfl.get_player_match_score_claim(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id
  );
end;
$$;

revoke all on function jfl_private.score_claim_actor_is_eligible(uuid,jfl.player_matches,uuid)
  from public,anon,authenticated;
revoke all on function jfl_private.resolve_expired_score_takeover(uuid,uuid)
  from public,anon,authenticated;
revoke all on function jfl.respond_player_match_score_takeover(uuid,uuid,uuid,text)
  from public,anon,authenticated;

grant execute on function jfl_private.score_claim_actor_is_eligible(uuid,jfl.player_matches,uuid)
  to service_role;
grant execute on function jfl_private.resolve_expired_score_takeover(uuid,uuid)
  to service_role;
grant execute on function jfl.respond_player_match_score_takeover(uuid,uuid,uuid,text)
  to service_role;
