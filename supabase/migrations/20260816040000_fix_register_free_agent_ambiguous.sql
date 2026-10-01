-- Fix register_free_agent 42702: RETURNS TABLE(season_id ...) created PL/pgSQL
-- variables that conflicted with INSERT/ON CONFLICT column names.
-- #variable_conflict use_column prefers table columns in SQL statements.

CREATE OR REPLACE FUNCTION public.register_free_agent(actor_user_id uuid, target_season_id uuid)
RETURNS TABLE(id uuid, season_id uuid, player_id uuid, participation_type text, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
#variable_conflict use_column
DECLARE
  actor_player_id uuid;
BEGIN
  IF actor_user_id IS NULL THEN RAISE EXCEPTION 'actor_user_id is required'; END IF;
  IF target_season_id IS NULL THEN RAISE EXCEPTION 'target_season_id is required'; END IF;
  SELECT p.id INTO actor_player_id FROM public.players p WHERE p.user_id = actor_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player profile is required before joining as a free agent'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.season_id = target_season_id AND tm.player_id = actor_player_id AND tm.ends_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Rostered players cannot register as free agents for the same season';
  END IF;
  RETURN QUERY
  INSERT INTO public.season_players AS sp (season_id, player_id, participation_type, status)
  VALUES (target_season_id, actor_player_id, 'free_agent', 'active')
  ON CONFLICT (season_id, player_id) DO UPDATE
    SET participation_type = EXCLUDED.participation_type, status = EXCLUDED.status
  RETURNING sp.id, sp.season_id, sp.player_id, sp.participation_type, sp.status;
END;
$function$;
REVOKE ALL ON FUNCTION public.register_free_agent(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_free_agent(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION jfl.register_free_agent(actor_user_id uuid, target_season_id uuid)
RETURNS TABLE(id uuid, season_id uuid, player_id uuid, participation_type text, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
#variable_conflict use_column
DECLARE actor_player_id uuid;
BEGIN
  IF actor_user_id IS NULL THEN RAISE EXCEPTION 'actor_user_id is required'; END IF;
  IF target_season_id IS NULL THEN RAISE EXCEPTION 'target_season_id is required'; END IF;
  SELECT p.id INTO actor_player_id FROM jfl.players p WHERE p.user_id = actor_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player profile is required before joining as a free agent'; END IF;
  IF EXISTS (
    SELECT 1 FROM jfl.team_memberships tm
    WHERE tm.season_id = target_season_id AND tm.player_id = actor_player_id AND tm.ends_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Rostered players cannot register as free agents for the same season';
  END IF;
  RETURN QUERY
  INSERT INTO jfl.season_players AS sp (season_id, player_id, participation_type, status)
  VALUES (target_season_id, actor_player_id, 'free_agent', 'active')
  ON CONFLICT (season_id, player_id) DO UPDATE
    SET participation_type = EXCLUDED.participation_type, status = EXCLUDED.status
  RETURNING sp.id, sp.season_id, sp.player_id, sp.participation_type, sp.status;
END;
$function$;
REVOKE ALL ON FUNCTION jfl.register_free_agent(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION jfl.register_free_agent(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION dru.register_free_agent(actor_user_id uuid, target_season_id uuid)
RETURNS TABLE(id uuid, season_id uuid, player_id uuid, participation_type text, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
#variable_conflict use_column
DECLARE actor_player_id uuid;
BEGIN
  IF actor_user_id IS NULL THEN RAISE EXCEPTION 'actor_user_id is required'; END IF;
  IF target_season_id IS NULL THEN RAISE EXCEPTION 'target_season_id is required'; END IF;
  SELECT p.id INTO actor_player_id FROM dru.players p WHERE p.user_id = actor_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player profile is required before joining as a free agent'; END IF;
  IF EXISTS (
    SELECT 1 FROM dru.team_memberships tm
    WHERE tm.season_id = target_season_id AND tm.player_id = actor_player_id AND tm.ends_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Rostered players cannot register as free agents for the same season';
  END IF;
  RETURN QUERY
  INSERT INTO dru.season_players AS sp (season_id, player_id, participation_type, status)
  VALUES (target_season_id, actor_player_id, 'free_agent', 'active')
  ON CONFLICT (season_id, player_id) DO UPDATE
    SET participation_type = EXCLUDED.participation_type, status = EXCLUDED.status
  RETURNING sp.id, sp.season_id, sp.player_id, sp.participation_type, sp.status;
END;
$function$;
REVOKE ALL ON FUNCTION dru.register_free_agent(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION dru.register_free_agent(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION gamma.register_free_agent(actor_user_id uuid, target_season_id uuid)
RETURNS TABLE(id uuid, season_id uuid, player_id uuid, participation_type text, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
#variable_conflict use_column
DECLARE actor_player_id uuid;
BEGIN
  IF actor_user_id IS NULL THEN RAISE EXCEPTION 'actor_user_id is required'; END IF;
  IF target_season_id IS NULL THEN RAISE EXCEPTION 'target_season_id is required'; END IF;
  SELECT p.id INTO actor_player_id FROM gamma.players p WHERE p.user_id = actor_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player profile is required before joining as a free agent'; END IF;
  IF EXISTS (
    SELECT 1 FROM gamma.team_memberships tm
    WHERE tm.season_id = target_season_id AND tm.player_id = actor_player_id AND tm.ends_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Rostered players cannot register as free agents for the same season';
  END IF;
  RETURN QUERY
  INSERT INTO gamma.season_players AS sp (season_id, player_id, participation_type, status)
  VALUES (target_season_id, actor_player_id, 'free_agent', 'active')
  ON CONFLICT (season_id, player_id) DO UPDATE
    SET participation_type = EXCLUDED.participation_type, status = EXCLUDED.status
  RETURNING sp.id, sp.season_id, sp.player_id, sp.participation_type, sp.status;
END;
$function$;
REVOKE ALL ON FUNCTION gamma.register_free_agent(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION gamma.register_free_agent(uuid, uuid) TO service_role;
