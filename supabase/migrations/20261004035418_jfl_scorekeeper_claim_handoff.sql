create table jfl_private.player_match_score_claims (
  player_match_id uuid not null references jfl.player_matches(id) on delete cascade,
  scoring_team_id uuid not null references jfl.teams(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete restrict,
  claimed_at timestamptz,
  pending_requester_user_id uuid references auth.users(id) on delete restrict,
  pending_requested_at timestamptz,
  pending_expires_at timestamptz,
  last_transition_at timestamptz not null default now(),
  primary key (player_match_id, scoring_team_id),
  check ((owner_user_id is null and claimed_at is null) or (owner_user_id is not null and claimed_at is not null)),
  check (
    (pending_requester_user_id is null and pending_requested_at is null and pending_expires_at is null)
    or
    (pending_requester_user_id is not null and pending_requested_at is not null and pending_expires_at is not null)
  )
);
alter table jfl_private.player_match_score_claims enable row level security;
revoke all on jfl_private.player_match_score_claims from public, anon, authenticated;
grant select, insert, update, delete on jfl_private.player_match_score_claims to service_role;

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

create or replace function jfl_private.require_score_claim_actor(actor_user_id uuid,target_match jfl.player_matches,target_scoring_team_id uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor_player_id uuid; restriction_reason text;
begin
  perform jfl_private.match_tracker_for_scoring_team(actor_user_id,target_match,target_scoring_team_id);
  select p.id into actor_player_id from jfl.players p where p.user_id=actor_user_id limit 1;
  select r.reason into restriction_reason from jfl_private.player_competition_restrictions r
   where r.season_id=target_match.season_id and r.player_id=actor_player_id and r.lifted_at is null limit 1;
  if restriction_reason is not null then raise exception 'Actor is marked ineligible for competition: %',restriction_reason; end if;
  return actor_player_id;
end; $$;

create or replace function jfl_private.resolve_expired_score_takeover(target_player_match_id uuid,target_scoring_team_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare claim jfl_private.player_match_score_claims%rowtype; next_owner uuid;
begin
  select * into claim from jfl_private.player_match_score_claims c
   where c.player_match_id=target_player_match_id and c.scoring_team_id=target_scoring_team_id for update;
  if not found or claim.pending_requester_user_id is null or claim.pending_expires_at>now() then return; end if;
  next_owner:=claim.pending_requester_user_id;
  update jfl_private.player_match_score_claims
   set owner_user_id=next_owner,claimed_at=now(),pending_requester_user_id=null,pending_requested_at=null,pending_expires_at=null,last_transition_at=now()
   where player_match_id=target_player_match_id and scoring_team_id=target_scoring_team_id;
  insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,reason,before_state,after_state)
  values(null,'player_match.scorekeeper_takeover_auto_transfer','player_match',target_player_match_id,
    'Takeover request auto-transferred after 15 seconds without a response',
    jsonb_build_object('scoringTeamId',target_scoring_team_id,'ownerUserId',claim.owner_user_id,'pendingRequesterUserId',claim.pending_requester_user_id,'pendingExpiresAt',claim.pending_expires_at),
    jsonb_build_object('scoringTeamId',target_scoring_team_id,'ownerUserId',next_owner));
end; $$;

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

create or replace function jfl.respond_player_match_score_takeover(actor_user_id uuid,target_player_match_id uuid,target_scoring_team_id uuid,decision text)
returns setof jfl_private.player_match_score_claim_state language plpgsql security definer set search_path='' as $$
declare target_match jfl.player_matches%rowtype; claim jfl_private.player_match_score_claims%rowtype; next_owner uuid;
begin
  if decision not in ('release','deny') then raise exception 'decision must be release or deny'; end if;
  select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id for update;
  if not found then raise exception 'Player match not found'; end if;
  perform jfl_private.require_score_claim_actor(actor_user_id,target_match,target_scoring_team_id);
  perform jfl_private.resolve_expired_score_takeover(target_player_match_id,target_scoring_team_id);
  select * into claim from jfl_private.player_match_score_claims c where c.player_match_id=target_player_match_id and c.scoring_team_id=target_scoring_team_id for update;
  if not found or claim.owner_user_id<>actor_user_id then raise exception 'Only the current scorekeeper can respond to takeover'; end if;
  if claim.pending_requester_user_id is null then raise exception 'No scorekeeping takeover request is pending'; end if;
  if decision='release' then
    next_owner:=claim.pending_requester_user_id;
    update jfl_private.player_match_score_claims set owner_user_id=next_owner,claimed_at=now(),pending_requester_user_id=null,pending_requested_at=null,pending_expires_at=null,last_transition_at=now()
     where player_match_id=target_player_match_id and scoring_team_id=target_scoring_team_id;
  else
    next_owner:=actor_user_id;
    update jfl_private.player_match_score_claims set pending_requester_user_id=null,pending_requested_at=null,pending_expires_at=null,last_transition_at=now()
     where player_match_id=target_player_match_id and scoring_team_id=target_scoring_team_id;
  end if;
  insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,after_state)
  values(actor_user_id,case when decision='release' then 'player_match.scorekeeper_takeover_release' else 'player_match.scorekeeper_takeover_deny' end,'player_match',target_player_match_id,
    jsonb_build_object('scoringTeamId',target_scoring_team_id,'requesterUserId',claim.pending_requester_user_id,'ownerUserId',next_owner));
  return query select * from jfl.get_player_match_score_claim(actor_user_id,target_player_match_id,target_scoring_team_id);
end; $$;

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

revoke all on function jfl_private.require_score_claim_actor(uuid,jfl.player_matches,uuid) from public,anon,authenticated;
revoke all on function jfl_private.resolve_expired_score_takeover(uuid,uuid) from public,anon,authenticated;
revoke all on function jfl.get_player_match_score_claim(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function jfl.claim_player_match_score(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function jfl.request_player_match_score_takeover(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function jfl.respond_player_match_score_takeover(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function jfl.release_player_match_score_claim(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function jfl_private.require_score_claim_actor(uuid,jfl.player_matches,uuid) to service_role;
grant execute on function jfl_private.resolve_expired_score_takeover(uuid,uuid) to service_role;
grant execute on function jfl.get_player_match_score_claim(uuid,uuid,uuid) to service_role;
grant execute on function jfl.claim_player_match_score(uuid,uuid,uuid) to service_role;
grant execute on function jfl.request_player_match_score_takeover(uuid,uuid,uuid) to service_role;
grant execute on function jfl.respond_player_match_score_takeover(uuid,uuid,uuid,text) to service_role;
grant execute on function jfl.release_player_match_score_claim(uuid,uuid,uuid) to service_role;
