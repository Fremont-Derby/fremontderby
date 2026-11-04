do $baseline$
begin
 -- Direct privileged dependencies must retain their qualified execution boundary.
 if exists (
   select 1 from (values
     ('jfl_private.resolve_expired_score_takeover(uuid,uuid)'),
     ('jfl_private.require_score_claim_actor(uuid,jfl.player_matches,uuid)'),
     ('jfl_private.score_claim_actor_is_eligible(uuid,jfl.player_matches,uuid)'),
     ('jfl_private.match_tracker_for_scoring_team(uuid,jfl.player_matches,uuid)'),
     ('jfl_private.assert_expected_score_history(uuid,uuid,jsonb)')
   ) expected(signature)
   left join pg_proc p on p.oid=to_regprocedure(expected.signature)
   where p.oid is null or not p.prosecdef
     or p.proowner <> 'postgres'::regrole
     or p.proconfig is distinct from array['search_path=""']::text[]
     or exists (select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
       where a.privilege_type='EXECUTE' and a.grantee not in ('postgres'::regrole,'service_role'::regrole))
 ) then raise exception 'Unqualified private scoring helper security boundary'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl_private.resolve_expired_score_takeover(uuid,uuid)') and md5(replace(p.prosrc,chr(13),''))='57080809c003adffbb9b95a815d5e02d' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified match-first expiry resolver'; end if;
 if exists (
   select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
     lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
   where n.nspname='jfl' and p.proname in (
     'record_player_match_score_rack','record_player_match_score_rack_checked',
     'update_player_match_score_rack','update_player_match_score_rack_checked',
     'undo_player_match_score_rack','undo_player_match_score_rack_checked',
     'confirm_player_match_score','confirm_player_match_score_checked')
     and a.privilege_type='EXECUTE' and a.grantee not in ('postgres'::regrole,'service_role'::regrole)
 ) then raise exception 'Unqualified ordinary scoring EXECUTE permissions'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.confirm_player_match_score(uuid,uuid,uuid)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='2eebd022209aca4b38f1510c3ae3b9ef' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: confirm_player_match_score'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.confirm_player_match_score_checked(uuid,uuid,uuid,jsonb)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='f4a0b392a204c4045e72475f142e5fb3' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: confirm_player_match_score_checked'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.record_player_match_score_rack(uuid,uuid,uuid,text)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='c30180d5ffd0b45fc6f444963b782fb6' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: record_player_match_score_rack'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.record_player_match_score_rack_checked(uuid,uuid,uuid,text,jsonb)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='00adfab08c58892ef9116e7ba131aa35' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: record_player_match_score_rack_checked'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.undo_player_match_score_rack(uuid,uuid,uuid)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='63d5b5969742217608456010c7e9e667' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: undo_player_match_score_rack'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.undo_player_match_score_rack_checked(uuid,uuid,uuid,jsonb)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='1326a9b99b731b6b1c1b21136ce3c9b3' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: undo_player_match_score_rack_checked'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.update_player_match_score_rack(uuid,uuid,uuid,integer,text)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='ee2a23250973894e126550526ddb1fa3' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: update_player_match_score_rack'; end if;
 if not exists (select 1 from pg_proc p where p.oid=to_regprocedure('jfl.update_player_match_score_rack_checked(uuid,uuid,uuid,integer,text,jsonb)') and p.proowner = 'postgres'::regrole and md5(replace(p.prosrc,chr(13),''))='a1871fba35aaf2518a2e7982fbc90af7' and p.prosecdef and p.proconfig=array['search_path=""']::text[]) then raise exception 'Unqualified #3288 baseline: update_player_match_score_rack_checked'; end if;
end;
$baseline$;
-- #3288 SOURCE CANDIDATE ONLY. Outside migrations: no automatic apply.
-- Requires coherent claim API + scorecard UI before promotion to a migration.
-- All ordinary writes lock match before claim; shared membership helper is unchanged.
create or replace function jfl_private.require_current_scorekeeper(
 actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid
) returns void language plpgsql security definer set search_path='' as $guard$
declare
 target_match jfl.player_matches%rowtype;
 current_owner uuid;
begin
 select * into target_match from jfl.player_matches pm
 where pm.id=target_player_match_id for update;
 if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_score_claim_actor(actor_user_id,target_match,target_scoring_team_id);
 perform jfl_private.resolve_expired_score_takeover(target_player_match_id,target_scoring_team_id);
 select c.owner_user_id into current_owner
 from jfl_private.player_match_score_claims c
 where c.player_match_id=target_player_match_id and c.scoring_team_id=target_scoring_team_id
 for update;
 if actor_user_id is null or current_owner is null or current_owner is distinct from actor_user_id then
   raise exception 'Only the current scorekeeper can change this team score' using errcode='42501';
 end if;
end;
$guard$;
revoke all on function jfl_private.require_current_scorekeeper(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function jfl_private.require_current_scorekeeper(uuid,uuid,uuid) to service_role;
CREATE OR REPLACE FUNCTION jfl.confirm_player_match_score(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, confirmed_at timestamp with time zone, histories_match boolean, both_confirmed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare target_match jfl.player_matches%rowtype; tracker_id uuid; submission jfl_private.player_match_score_submissions%rowtype; opponent_submission jfl_private.player_match_score_submissions%rowtype; next_score_a integer; next_score_b integer; confirmed_time timestamptz; begin select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id for update; if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);
 if target_match.status in ('finalized','corrected') then raise exception 'Player match is finalized'; end if; tracker_id:=jfl_private.match_tracker_for_scoring_team(actor_user_id,target_match,target_scoring_team_id); select * into submission from jfl_private.player_match_score_submissions s where s.player_match_id=target_player_match_id and s.tracker_player_id=tracker_id for update; if not found or jsonb_array_length(submission.racks)=0 then raise exception 'Score record is empty'; end if; select count(*) filter(where elem->>'winnerSide'='A')::integer,count(*) filter(where elem->>'winnerSide'='B')::integer into next_score_a,next_score_b from jsonb_array_elements(submission.racks) elem; if next_score_a<target_match.race_to_a and next_score_b<target_match.race_to_b then raise exception 'Race target must be reached before confirmation'; end if; confirmed_time:=now(); update jfl_private.player_match_score_submissions set confirmed_at=confirmed_time,updated_at=confirmed_time where id=submission.id returning * into submission; select * into opponent_submission from jfl_private.player_match_score_submissions s where s.player_match_id=target_player_match_id and s.tracker_player_id<>tracker_id limit 1; insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,before_state,after_state) values(actor_user_id,'player_match.team_score_confirm','player_match',target_player_match_id,jsonb_build_object('scoringTeamId',target_scoring_team_id,'trackerPlayerId',tracker_id),jsonb_build_object('scoringTeamId',target_scoring_team_id,'trackerPlayerId',tracker_id,'confirmedAt',confirmed_time)); return query select target_player_match_id,target_scoring_team_id,tracker_id,confirmed_time,(opponent_submission.id is not null and opponent_submission.racks=submission.racks),(opponent_submission.confirmed_at is not null and submission.confirmed_at is not null); end; $function$
;

CREATE OR REPLACE FUNCTION jfl.confirm_player_match_score_checked(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid, expected_racks jsonb)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, confirmed_at timestamp with time zone, histories_match boolean, both_confirmed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  target_match jfl.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from jfl.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);


  tracker_id := jfl_private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform jfl_private.assert_expected_score_history(
    target_player_match_id,
    tracker_id,
    expected_racks
  );

  return query
  select * from jfl.confirm_player_match_score(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION jfl.record_player_match_score_rack(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid, rack_winner_side text)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, rack_number integer, discipline text, winner_side text, score_a integer, score_b integer, record_complete boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare target_match jfl.player_matches%rowtype; tracker_id uuid; existing_submission jfl_private.player_match_score_submissions%rowtype; next_rack_number integer; rack_discipline text; next_racks jsonb; next_score_a integer; next_score_b integer; begin if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if; if rack_winner_side not in ('A','B') then raise exception 'rack_winner_side must be A or B'; end if; select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id for update; if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);
 if target_match.status in ('finalized','corrected') then raise exception 'Player match is finalized'; end if; if target_match.race_to_a is null or target_match.race_to_b is null then raise exception 'Race targets are required before recording racks'; end if; tracker_id:=jfl_private.match_tracker_for_scoring_team(actor_user_id,target_match,target_scoring_team_id); select * into existing_submission from jfl_private.player_match_score_submissions s where s.player_match_id=target_player_match_id and s.tracker_player_id=tracker_id for update; if not found then existing_submission.racks:='[]'::jsonb; end if; select count(*) filter(where elem->>'winnerSide'='A')::integer,count(*) filter(where elem->>'winnerSide'='B')::integer into next_score_a,next_score_b from jsonb_array_elements(existing_submission.racks) elem; if next_score_a>=target_match.race_to_a or next_score_b>=target_match.race_to_b then raise exception 'Score record is already complete'; end if; next_rack_number:=jsonb_array_length(existing_submission.racks)+1; rack_discipline:=case when next_rack_number<=target_match.opening_block_length then target_match.opening_discipline when target_match.opening_discipline='8-ball' then '9-ball' else '8-ball' end; next_racks:=existing_submission.racks||jsonb_build_array(jsonb_build_object('rackNumber',next_rack_number,'discipline',rack_discipline,'winnerSide',rack_winner_side)); select count(*) filter(where elem->>'winnerSide'='A')::integer,count(*) filter(where elem->>'winnerSide'='B')::integer into next_score_a,next_score_b from jsonb_array_elements(next_racks) elem; insert into jfl_private.player_match_score_submissions(season_id,player_match_id,tracker_player_id,racks,confirmed_at,updated_at) values(target_match.season_id,target_player_match_id,tracker_id,next_racks,null,now()) on conflict on constraint player_match_score_submission_player_match_id_tracker_playe_key do update set racks=excluded.racks,confirmed_at=null,updated_at=now(); insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,before_state,after_state) values(actor_user_id,'player_match.team_score_rack_record','player_match',target_player_match_id,jsonb_build_object('scoringTeamId',target_scoring_team_id,'trackerPlayerId',tracker_id,'racks',coalesce(existing_submission.racks,'[]'::jsonb)),jsonb_build_object('scoringTeamId',target_scoring_team_id,'trackerPlayerId',tracker_id,'racks',next_racks)); return query select target_player_match_id,target_scoring_team_id,tracker_id,next_rack_number,rack_discipline,rack_winner_side,next_score_a,next_score_b,(next_score_a>=target_match.race_to_a or next_score_b>=target_match.race_to_b); end; $function$
;

CREATE OR REPLACE FUNCTION jfl.record_player_match_score_rack_checked(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid, rack_winner_side text, expected_racks jsonb)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, rack_number integer, discipline text, winner_side text, score_a integer, score_b integer, record_complete boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  target_match jfl.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from jfl.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);


  tracker_id := jfl_private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform jfl_private.assert_expected_score_history(
    target_player_match_id,
    tracker_id,
    expected_racks
  );

  return query
  select * from jfl.record_player_match_score_rack(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id,
    rack_winner_side
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION jfl.undo_player_match_score_rack(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, undone_rack_number integer, score_a integer, score_b integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare target_match jfl.player_matches%rowtype; tracker_id uuid; submission jfl_private.player_match_score_submissions%rowtype; rack_count integer; next_racks jsonb; next_score_a integer; next_score_b integer; begin select * into target_match from jfl.player_matches pm where pm.id=target_player_match_id for update; if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);
 if target_match.status in ('finalized','corrected') then raise exception 'Player match is finalized'; end if; tracker_id:=jfl_private.match_tracker_for_scoring_team(actor_user_id,target_match,target_scoring_team_id); select * into submission from jfl_private.player_match_score_submissions s where s.player_match_id=target_player_match_id and s.tracker_player_id=tracker_id for update; if not found or jsonb_array_length(submission.racks)=0 then raise exception 'Score record has no racks to undo'; end if; rack_count:=jsonb_array_length(submission.racks); next_racks:=submission.racks-(rack_count-1); select count(*) filter(where elem->>'winnerSide'='A')::integer,count(*) filter(where elem->>'winnerSide'='B')::integer into next_score_a,next_score_b from jsonb_array_elements(next_racks) elem; update jfl_private.player_match_score_submissions set racks=next_racks,confirmed_at=null,updated_at=now() where id=submission.id; insert into jfl_private.audit_events(actor_user_id,action,entity_type,entity_id,before_state,after_state) values(actor_user_id,'player_match.team_score_rack_undo','player_match',target_player_match_id,jsonb_build_object('scoringTeamId',target_scoring_team_id,'trackerPlayerId',tracker_id,'racks',submission.racks),jsonb_build_object('scoringTeamId',target_scoring_team_id,'trackerPlayerId',tracker_id,'racks',next_racks)); return query select target_player_match_id,target_scoring_team_id,tracker_id,rack_count,next_score_a,next_score_b; end; $function$
;

CREATE OR REPLACE FUNCTION jfl.undo_player_match_score_rack_checked(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid, expected_racks jsonb)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, undone_rack_number integer, score_a integer, score_b integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  target_match jfl.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from jfl.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);


  tracker_id := jfl_private.match_tracker_for_scoring_team(
    actor_user_id,
    target_match,
    target_scoring_team_id
  );
  perform jfl_private.assert_expected_score_history(
    target_player_match_id,
    tracker_id,
    expected_racks
  );

  return query
  select * from jfl.undo_player_match_score_rack(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION jfl.update_player_match_score_rack(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid, target_rack_number integer, rack_winner_side text)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, rack_number integer, discipline text, previous_winner_side text, winner_side text, score_a integer, score_b integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  target_match jfl.player_matches%rowtype;
  tracker_id uuid;
  submission jfl_private.player_match_score_submissions%rowtype;
  rack_count integer;
  existing_rack jsonb;
  previous_winner text;
  rack_discipline text;
  next_racks jsonb;
  next_score_a integer;
  next_score_b integer;
begin
  if target_player_match_id is null then raise exception 'target_player_match_id is required'; end if;
  if target_rack_number is null or target_rack_number < 1 then raise exception 'target_rack_number must be a positive integer'; end if;
  if rack_winner_side not in ('A', 'B') then raise exception 'rack_winner_side must be A or B'; end if;

  select * into target_match
  from jfl.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);

  if target_match.status in ('finalized', 'corrected') then raise exception 'Player match is finalized'; end if;

  tracker_id := jfl_private.match_tracker_for_scoring_team(actor_user_id, target_match, target_scoring_team_id);

  select * into submission
  from jfl_private.player_match_score_submissions s
  where s.player_match_id = target_player_match_id
    and s.tracker_player_id = tracker_id
  for update;

  if not found then raise exception 'Score record is empty'; end if;
  rack_count := jsonb_array_length(coalesce(submission.racks, '[]'::jsonb));
  if target_rack_number > rack_count then raise exception 'Rack is not present in this team score record'; end if;

  existing_rack := submission.racks -> (target_rack_number - 1);
  previous_winner := existing_rack ->> 'winnerSide';
  rack_discipline := existing_rack ->> 'discipline';
  if previous_winner not in ('A', 'B') or rack_discipline not in ('8-ball', '9-ball') then
    raise exception 'Rack record is invalid';
  end if;

  if previous_winner = rack_winner_side then
    select
      count(*) filter (where elem ->> 'winnerSide' = 'A')::integer,
      count(*) filter (where elem ->> 'winnerSide' = 'B')::integer
    into next_score_a, next_score_b
    from jsonb_array_elements(submission.racks) elem;

    return query select target_player_match_id, target_scoring_team_id, tracker_id,
      target_rack_number, rack_discipline, previous_winner, rack_winner_side,
      next_score_a, next_score_b;
    return;
  end if;

  next_racks := jsonb_set(
    submission.racks,
    array[(target_rack_number - 1)::text, 'winnerSide'],
    to_jsonb(rack_winner_side),
    false
  );

  select
    count(*) filter (where elem ->> 'winnerSide' = 'A')::integer,
    count(*) filter (where elem ->> 'winnerSide' = 'B')::integer
  into next_score_a, next_score_b
  from jsonb_array_elements(next_racks) elem;

  update jfl_private.player_match_score_submissions
  set racks = next_racks,
      confirmed_at = null,
      updated_at = now()
  where id = submission.id;

  insert into jfl_private.audit_events(actor_user_id, action, entity_type, entity_id, before_state, after_state)
  values (
    actor_user_id,
    'player_match.team_score_rack_edit',
    'player_match',
    target_player_match_id,
    jsonb_build_object(
      'scoringTeamId', target_scoring_team_id,
      'trackerPlayerId', tracker_id,
      'rackNumber', target_rack_number,
      'discipline', rack_discipline,
      'winnerSide', previous_winner,
      'racks', submission.racks
    ),
    jsonb_build_object(
      'scoringTeamId', target_scoring_team_id,
      'trackerPlayerId', tracker_id,
      'rackNumber', target_rack_number,
      'discipline', rack_discipline,
      'winnerSide', rack_winner_side,
      'racks', next_racks
    )
  );

  return query select target_player_match_id, target_scoring_team_id, tracker_id,
    target_rack_number, rack_discipline, previous_winner, rack_winner_side,
    next_score_a, next_score_b;
end;
$function$
;

CREATE OR REPLACE FUNCTION jfl.update_player_match_score_rack_checked(actor_user_id uuid, target_player_match_id uuid, target_scoring_team_id uuid, target_rack_number integer, rack_winner_side text, expected_racks jsonb)
 RETURNS TABLE(player_match_id uuid, scoring_team_id uuid, tracker_player_id uuid, rack_number integer, discipline text, previous_winner_side text, winner_side text, score_a integer, score_b integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare
  target_match jfl.player_matches%rowtype;
  tracker_id uuid;
begin
  select * into target_match
  from jfl.player_matches pm
  where pm.id = target_player_match_id
  for update;
  if not found then raise exception 'Player match not found'; end if;
 perform jfl_private.require_current_scorekeeper(actor_user_id,target_player_match_id,target_scoring_team_id);


  tracker_id := jfl_private.match_tracker_for_scoring_team(actor_user_id, target_match, target_scoring_team_id);
  perform jfl_private.assert_expected_score_history(target_player_match_id, tracker_id, expected_racks);

  return query
  select * from jfl.update_player_match_score_rack(
    actor_user_id,
    target_player_match_id,
    target_scoring_team_id,
    target_rack_number,
    rack_winner_side
  );
end;
$function$
;

