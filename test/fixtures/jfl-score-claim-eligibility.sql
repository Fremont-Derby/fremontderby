-- Hosted catalog 2026-11-04 / release 5924e674, including 20261023164000 repair.
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

CREATE OR REPLACE FUNCTION jfl_private.score_claim_actor_is_eligible(actor_user_id uuid, target_match jfl.player_matches, target_scoring_team_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
