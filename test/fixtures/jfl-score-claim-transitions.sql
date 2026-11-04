-- Captured from release 5924e674; includes 20261023164000 Release repair.
-- Bodies qualified by read-only hosted catalog on 2026-11-04. Local proof only.
create type jfl_private.player_match_score_claim_state as (
  player_match_id uuid,
  scoring_team_id uuid,
  owner_user_id uuid,
  owner_display_name text,
  pending_requester_user_id uuid,
  pending_requester_display_name text,
  pending_expires_at timestamptz,
  viewer_is_owner boolean,
  viewer_is_requester boolean
);

create or replace function jfl.get_player_match_score_claim(actor_user_id uuid,target_player_match_id uuid,target_scoring_team_id uuid)
returns setof jfl_private.player_match_score_claim_state language plpgsql security definer set search_path='' as $$
declare target_match jfl.player_matches%rowtype;
begin
  select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id;
  if not found then raise exception 'Player match not found'; end if;
  perform jfl_private.require_score_claim_actor(actor_user_id,target_match,target_scoring_team_id);
  perform jfl_private.resolve_expired_score_takeover(target_player_match_id,target_scoring_team_id);
  return query select target_player_match_id,target_scoring_team_id,c.owner_user_id,owner_player.display_name,c.pending_requester_user_id,requester_player.display_name,c.pending_expires_at,c.owner_user_id=actor_user_id,c.pending_requester_user_id=actor_user_id
   from (select 1) seed
   left join jfl_private.player_match_score_claims c on c.player_match_id=target_player_match_id and c.scoring_team_id=target_scoring_team_id
   left join jfl.players owner_player on owner_player.user_id=c.owner_user_id
   left join jfl.players requester_player on requester_player.user_id=c.pending_requester_user_id;
end; $$;

create or replace function jfl.claim_player_match_score(actor_user_id uuid,target_player_match_id uuid,target_scoring_team_id uuid)
returns setof jfl_private.player_match_score_claim_state language plpgsql security definer set search_path='' as $$
declare target_match jfl.player_matches%rowtype; claim jfl_private.player_match_score_claims%rowtype; changed boolean:=false;
begin
  select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  perform jfl_private.require_score_claim_actor(actor_user_id,target_match,target_scoring_team_id);
  perform jfl_private.resolve_expired_score_takeover(target_player_match_id,target_scoring_team_id);
  select * into claim from jfl_private.player_match_score_claims c where c.player_match_id=target_player_match_id and c.scoring_team_id=target_scoring_team_id for update;
  if not found then
    insert into jfl_private.player_match_score_claims(player_match_id,scoring_team_id,owner_user_id,claimed_at) values(target_player_match_id,target_scoring_team_id,actor_user_id,now()); changed:=true;
  elsif claim.owner_user_id is null then
    update jfl_private.player_match_score_claims set owner_user_id=actor_user_id,claimed_at=now(),pending_requester_user_id=null,pending_requested_at=null,pending_expires_at=null,last_transition_at=now()
     where player_match_id=target_player_match_id and scoring_team_id=target_scoring_team_id; changed:=true;
  elsif claim.owner_user_id<>actor_user_id then raise exception 'Scorekeeping is already claimed; request takeover'; end if;
  if changed then insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,after_state)
    values(actor_user_id,'player_match.scorekeeper_claim','player_match',target_player_match_id,jsonb_build_object('scoringTeamId',target_scoring_team_id,'ownerUserId',actor_user_id)); end if;
  return query select * from jfl.get_player_match_score_claim(actor_user_id,target_player_match_id,target_scoring_team_id);
end; $$;

create or replace function jfl.request_player_match_score_takeover(actor_user_id uuid,target_player_match_id uuid,target_scoring_team_id uuid)
returns setof jfl_private.player_match_score_claim_state language plpgsql security definer set search_path='' as $$
declare target_match jfl.player_matches%rowtype; claim jfl_private.player_match_score_claims%rowtype;
begin
  select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  perform jfl_private.require_score_claim_actor(actor_user_id,target_match,target_scoring_team_id);
  perform jfl_private.resolve_expired_score_takeover(target_player_match_id,target_scoring_team_id);
  select * into claim from jfl_private.player_match_score_claims c where c.player_match_id=target_player_match_id and c.scoring_team_id=target_scoring_team_id for update;
  if not found or claim.owner_user_id is null then return query select * from jfl.claim_player_match_score(actor_user_id,target_player_match_id,target_scoring_team_id); return; end if;
  if claim.owner_user_id=actor_user_id then return query select * from jfl.get_player_match_score_claim(actor_user_id,target_player_match_id,target_scoring_team_id); return; end if;
  if claim.pending_requester_user_id is not null and claim.pending_requester_user_id<>actor_user_id then raise exception 'Another scorekeeping takeover request is already pending'; end if;
  if claim.pending_requester_user_id is null then
    update jfl_private.player_match_score_claims set pending_requester_user_id=actor_user_id,pending_requested_at=now(),pending_expires_at=now()+interval '15 seconds',last_transition_at=now()
     where player_match_id=target_player_match_id and scoring_team_id=target_scoring_team_id;
    insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,after_state)
    values(actor_user_id,'player_match.scorekeeper_takeover_request','player_match',target_player_match_id,
      jsonb_build_object('scoringTeamId',target_scoring_team_id,'currentOwnerUserId',claim.owner_user_id,'requesterUserId',actor_user_id,'timeoutSeconds',15));
  end if;
  return query select * from jfl.get_player_match_score_claim(actor_user_id,target_player_match_id,target_scoring_team_id);
end; $$;

CREATE OR REPLACE FUNCTION jfl.respond_player_match_score_takeover(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid, decision text)
 RETURNS SETOF jfl_private.player_match_score_claim_state
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

create or replace function jfl.release_player_match_score_claim(actor_user_id uuid,target_player_match_id uuid,target_scoring_team_id uuid)
returns setof jfl_private.player_match_score_claim_state language plpgsql security definer set search_path='' as $$
declare target_match jfl.player_matches%rowtype; claim jfl_private.player_match_score_claims%rowtype;
begin
  select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  perform jfl_private.require_score_claim_actor(actor_user_id,target_match,target_scoring_team_id);
  perform jfl_private.resolve_expired_score_takeover(target_player_match_id,target_scoring_team_id);
  select * into claim from jfl_private.player_match_score_claims c where c.player_match_id=target_player_match_id and c.scoring_team_id=target_scoring_team_id for update;
  if not found or claim.owner_user_id<>actor_user_id then raise exception 'Only the current scorekeeper can release scorekeeping'; end if;
  update jfl_private.player_match_score_claims set owner_user_id=null,claimed_at=null,pending_requester_user_id=null,pending_requested_at=null,pending_expires_at=null,last_transition_at=now()
   where player_match_id=target_player_match_id and scoring_team_id=target_scoring_team_id;
  insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,after_state)
  values(actor_user_id,'player_match.scorekeeper_release','player_match',target_player_match_id,jsonb_build_object('scoringTeamId',target_scoring_team_id,'ownerUserId',null));
  return query select * from jfl.get_player_match_score_claim(actor_user_id,target_player_match_id,target_scoring_team_id);
end; $$;

