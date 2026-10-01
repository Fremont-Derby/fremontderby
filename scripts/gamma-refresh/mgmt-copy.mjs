/**
 * Production → gamma copy via Supabase Management SQL API.
 * Uses SUPABASE_ACCESS_TOKEN (GitHub Actions secret). Never logs the token.
 */
import {
  PRODUCTION_PROJECT_REF,
  GAMMA_STAGING_PROJECT_REF,
} from './preflight.mjs';

const TABLE_ORDER = [
  'seasons',
  'players',
  'teams',
  'rounds',
  'player_ratings',
  'season_players',
  'team_memberships',
  'team_matches',
  'player_matches',
  'player_match_racks',
  'team_match_forfeits',
  'season_prize_configurations',
  'season_prize_payout_templates',
  'season_final_prize_payouts',
  'season_race_chart_bands',
  'direct_conversations',
  'direct_messages',
  'direct_chat_reads',
  'league_chat_messages',
  'league_chat_reads',
  'matchup_chat_messages',
  'matchup_chat_reads',
  'team_chat_messages',
  'team_chat_reads',
  'player_chat_blocks',
  'chat_message_reports',
  'user_notifications',
];

async function runSql(ref, token, query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'fremont-gamma-refresh',
    },
    body: JSON.stringify({ query }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`SQL on ${ref} failed HTTP ${response.status}: ${text.slice(0, 400)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function copyTable(token, table) {
  const countRows = await runSql(
    PRODUCTION_PROJECT_REF,
    token,
    `select count(*)::int as c from public.${table}`,
  );
  const count = countRows?.[0]?.c ?? 0;
  if (count === 0) {
    return 0;
  }

  let exportSql = `select coalesce(json_agg(row_to_json(x))::text, '[]') as data from public.${table} x`;
  // Deduplicate memberships for gamma unique index
  if (table === 'team_memberships') {
    exportSql = `
      select coalesce(json_agg(row_to_json(x))::text, '[]') as data from (
        select distinct on (season_id, player_id) *
        from public.team_memberships
        order by season_id, player_id, ends_at nulls first, starts_at desc
      ) x`;
  }

  const exported = await runSql(PRODUCTION_PROJECT_REF, token, exportSql);
  const payload = exported?.[0]?.data ?? '[]';
  const esc = String(payload).replace(/'/g, "''");
  const writeSql = `
SET session_replication_role = replica;
DELETE FROM gamma.${table};
INSERT INTO gamma.${table}
SELECT * FROM json_populate_recordset(NULL::gamma.${table}, '${esc}'::json);
SET session_replication_role = DEFAULT;
SELECT count(*)::int AS c FROM gamma.${table};
`;
  await runSql(GAMMA_STAGING_PROJECT_REF, token, writeSql);
  return count;
}

export async function refreshViaManagementApi({
  token,
  trigger = 'manual',
  gitSha = '',
}) {
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required for management refresh');

  const results = {};
  for (const table of TABLE_ORDER) {
    results[table] = await copyTable(token, table);
    console.log(`copied ${table}: ${results[table]}`);
  }

  const notes = 'prod public → gamma via management SQL';
  const sha = String(gitSha || '').replace(/'/g, '');
  const trig = String(trigger || 'manual').replace(/'/g, '');
  await runSql(
    GAMMA_STAGING_PROJECT_REF,
    token,
    `
CREATE TABLE IF NOT EXISTS gamma.ops_refresh_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_success_at timestamptz,
  last_trigger text,
  source_project_ref text,
  source_git_sha text,
  notes text
);
INSERT INTO gamma.ops_refresh_state (id, last_success_at, last_trigger, source_project_ref, source_git_sha, notes)
VALUES (1, now(), '${trig}', '${PRODUCTION_PROJECT_REF}', ${sha ? `'${sha}'` : 'null'}, '${notes}')
ON CONFLICT (id) DO UPDATE SET
  last_success_at = EXCLUDED.last_success_at,
  last_trigger = EXCLUDED.last_trigger,
  source_project_ref = EXCLUDED.source_project_ref,
  source_git_sha = EXCLUDED.source_git_sha,
  notes = EXCLUDED.notes;
`,
  );

  return {
    ok: true,
    mode: 'management-api',
    sourceProjectRef: PRODUCTION_PROJECT_REF,
    targetProjectRef: GAMMA_STAGING_PROJECT_REF,
    results,
  };
}
