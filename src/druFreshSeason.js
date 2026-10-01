import { withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export async function reserveFreshDruSeason(env, { seasonName }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env)) return null;
  const name = String(seasonName || '').trim();
  if (!name) return null;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
    prefer: 'return=representation',
  };
  const existing = await fetchWithSchema(`${base}/rest/v1/seasons?status=eq.registration&select=id,name`, { headers });
  if (!existing.ok) return null;
  const rows = await existing.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;
  if (rows.some((row) => String(row.name || '').trim() === name)) return null;
  const inserted = await fetchWithSchema(`${base}/rest/v1/seasons`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      status: 'registration',
      league_night: 'thursday',
      first_round_date: '2026-10-22',
      roster_lock_round: 4,
      opening_block_length: 7,
      individual_min_matches: 4,
      round_interval_days: 7,
      default_table_numbers: [1, 2, 3, 4],
      race_chart_version: 'apa-8ft',
      playoff_team_count: 4,
      playoff_anchor_tiebreaker: true,
    }),
  });
  if (!inserted.ok) return null;
  const created = await inserted.json();
  return created?.[0]?.id || null;
}

// registration status is the team-screen gate
