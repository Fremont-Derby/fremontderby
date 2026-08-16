-- P0: rebuild_generated_team_match_results must not wipe player matches after
-- scoring has started (status in_progress/finalized/corrected or any racks).

DO $do$
DECLARE
  rec record;
  def text;
  pub text;
  guard text;
  needle text := 'if not found then return; end if;';
BEGIN
  FOR rec IN
    SELECT n.nspname AS priv,
           CASE n.nspname
             WHEN 'private' THEN 'public'
             WHEN 'jfl_private' THEN 'jfl'
             WHEN 'dru_private' THEN 'dru'
             WHEN 'gamma_private' THEN 'gamma'
           END AS pub
    FROM pg_namespace n
    WHERE n.nspname IN ('private', 'jfl_private', 'dru_private', 'gamma_private')
  LOOP
    SELECT pg_get_functiondef(p.oid) INTO def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = rec.priv
      AND p.proname = 'rebuild_generated_team_match_results'
    LIMIT 1;

    IF def IS NULL THEN
      CONTINUE;
    END IF;
    IF def LIKE '%Cannot regenerate player matches after scoring%' THEN
      CONTINUE;
    END IF;

    pub := rec.pub;
    guard := E'\n\n  -- P0: do not wipe scored / in-progress player matches on lineup churn.\n'
      || '  if exists (\n'
      || '    select 1\n'
      || '    from ' || pub || '.player_matches pm\n'
      || '    where pm.team_match_id = target_team_match_id\n'
      || '      and pm.status in (''in_progress'', ''finalized'', ''corrected'')\n'
      || '  ) then\n'
      || '    raise exception ''Cannot regenerate player matches after scoring has started for this team match'';\n'
      || '  end if;\n\n'
      || '  if exists (\n'
      || '    select 1\n'
      || '    from ' || pub || '.player_match_racks r\n'
      || '    join ' || pub || '.player_matches pm on pm.id = r.player_match_id\n'
      || '    where pm.team_match_id = target_team_match_id\n'
      || '  ) then\n'
      || '    raise exception ''Cannot regenerate player matches after racks have been recorded for this team match'';\n'
      || '  end if;\n';

    -- Prefer compact single-line form used in live functions.
    IF position(needle in lower(def)) = 0 THEN
      -- try multiline variant via regex-like replace of first return after not found
      def := regexp_replace(
        def,
        'if not found then[[:space:]]+return;[[:space:]]+end if;',
        'if not found then return; end if;' || guard,
        1,
        1,
        'in'
      );
    ELSE
      def := replace(def, needle, needle || guard);
      -- only first occurrence: if multiple, still ok
    END IF;

    EXECUTE def;
  END LOOP;
END
$do$;
