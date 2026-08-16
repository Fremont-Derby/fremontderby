-- Fix set_own_date_availability 42702: RETURNS TABLE(player_id ...) conflicted with
-- ON CONFLICT (round_id, player_id) in free_agent_availability cache write.
-- #variable_conflict use_column prefers table columns in SQL statements.

DO $$
DECLARE
  sch text;
  def text;
BEGIN
  FOREACH sch IN ARRAY ARRAY['public', 'jfl', 'dru', 'gamma'] LOOP
    SELECT pg_get_functiondef(p.oid) INTO def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = sch AND p.proname = 'set_own_date_availability'
    LIMIT 1;
    IF def IS NULL THEN
      CONTINUE;
    END IF;
    IF def NOT LIKE '%#variable_conflict use_column%' THEN
      def := replace(def, 'AS $function$' || chr(10) || 'declare', 'AS $function$' || chr(10) || '#variable_conflict use_column' || chr(10) || 'declare');
      def := replace(def, 'AS $function$' || chr(10) || 'DECLARE', 'AS $function$' || chr(10) || '#variable_conflict use_column' || chr(10) || 'DECLARE');
      EXECUTE def;
    END IF;
  END LOOP;
END $$;
