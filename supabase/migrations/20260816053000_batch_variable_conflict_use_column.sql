-- Prevent 42702 ambiguous column errors in PL/pgSQL functions that
-- RETURNS TABLE(... player_id ...) and also use ON CONFLICT (... player_id).
-- SQL-language functions cannot use #variable_conflict and do not need it.

DO $do$
DECLARE
  r record;
  def text;
BEGIN
  FOR r IN
    SELECT n.nspname, p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'jfl', 'dru', 'gamma')
      AND p.prokind = 'f'
      AND pg_get_function_result(p.oid) ILIKE '%TABLE%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%#variable_conflict%'
      AND pg_get_functiondef(p.oid) ~* 'language plpgsql'
  LOOP
    def := pg_get_functiondef(r.oid);
    IF def LIKE E'%AS $function$\ndeclare%' THEN
      def := replace(def, E'AS $function$\ndeclare', E'AS $function$\n#variable_conflict use_column\ndeclare');
    ELSIF def LIKE E'%AS $function$\nDECLARE%' THEN
      def := replace(def, E'AS $function$\nDECLARE', E'AS $function$\n#variable_conflict use_column\nDECLARE');
    ELSIF def LIKE E'%AS $function$\nbegin%' THEN
      def := replace(def, E'AS $function$\nbegin', E'AS $function$\n#variable_conflict use_column\nbegin');
    ELSIF def LIKE E'%AS $function$\nBEGIN%' THEN
      def := replace(def, E'AS $function$\nBEGIN', E'AS $function$\n#variable_conflict use_column\nBEGIN');
    ELSE
      CONTINUE;
    END IF;
    BEGIN
      EXECUTE def;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip %.%: %', r.nspname, r.proname, SQLERRM;
    END;
  END LOOP;
END
$do$;
