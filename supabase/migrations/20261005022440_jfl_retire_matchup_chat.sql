-- #3307: JFL retires matchup chat; retain history and moderation.
-- No other schema or social preference is changed.
DO $guard$
BEGIN
  IF md5(pg_get_functiondef('jfl.get_my_matchup_chat_inbox(uuid)'::regprocedure)) <> 'f4dd92fd51b492ae1fce36d754283ee6' THEN
    RAISE EXCEPTION 'Unexpected get_my_matchup_chat_inbox definition; review current JFL before applying';
  END IF;
  IF md5(pg_get_functiondef('jfl.mark_matchup_chat_read(uuid,uuid,timestamp with time zone)'::regprocedure)) <> '182ca9f92318de36b5efeb0261151e3c' THEN
    RAISE EXCEPTION 'Unexpected mark_matchup_chat_read definition; review current JFL before applying';
  END IF;
  IF md5(pg_get_functiondef('jfl.send_matchup_chat_message(uuid,uuid,text,uuid)'::regprocedure)) <> '982699d0f78c9a26d3a649bc55685ae9' THEN
    RAISE EXCEPTION 'Unexpected send_matchup_chat_message definition; review current JFL before applying';
  END IF;
END;
$guard$;

CREATE OR REPLACE FUNCTION jfl.get_my_matchup_chat_inbox(actor_user_id uuid)
 RETURNS TABLE(team_match_id uuid, season_id uuid, season_name text, round_number integer, scheduled_on date, team_a_name text, team_b_name text, last_message_body text, last_message_at timestamp with time zone, unread_count bigint, can_send boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $retired$
BEGIN
  RETURN;
END;
$retired$;

CREATE OR REPLACE FUNCTION jfl.mark_matchup_chat_read(actor_user_id uuid, target_team_match_id uuid, read_through_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(team_match_id uuid, player_id uuid, last_read_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $retired$
BEGIN
  RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Matchup chat is retired';
END;
$retired$;

CREATE OR REPLACE FUNCTION jfl.send_matchup_chat_message(actor_user_id uuid, target_team_match_id uuid, message_body text, message_client_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(message_id uuid, team_match_id uuid, author_player_id uuid, author_display_name text, author_team_name text, body text, created_at timestamp with time zone, is_own boolean)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $retired$
BEGIN
  RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Matchup chat is retired';
END;
$retired$;

CREATE FUNCTION jfl.enforce_matchup_chat_retirement()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $retired$
BEGIN
  IF TG_TABLE_NAME = 'matchup_chat_reads' OR TG_OP = 'INSERT' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Matchup chat is retired';
  END IF;
  -- Only moderation metadata may change on retained historical messages.
  IF (to_jsonb(NEW) - 'removed_at' - 'removed_by') IS DISTINCT FROM
     (to_jsonb(OLD) - 'removed_at' - 'removed_by') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Matchup chat is retired';
  END IF;
  RETURN NEW;
END;
$retired$;
REVOKE ALL ON FUNCTION jfl.enforce_matchup_chat_retirement() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER matchup_chat_retirement BEFORE INSERT OR UPDATE ON jfl.matchup_chat_messages
FOR EACH ROW EXECUTE FUNCTION jfl.enforce_matchup_chat_retirement();
CREATE TRIGGER matchup_chat_retirement BEFORE INSERT OR UPDATE ON jfl.matchup_chat_reads
FOR EACH ROW EXECUTE FUNCTION jfl.enforce_matchup_chat_retirement();
