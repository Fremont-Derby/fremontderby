import { waiveDruTeamPayments } from './druLineupBypass.js';
import { withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export async function waiveDruRaceBeforeScore(env, playerMatchId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !playerMatchId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' };
  const match = await fetchWithSchema(`${base}/rest/v1/player_matches?id=eq.${playerMatchId}&select=season_id,team_a_id,team_b_id`, { headers });
  if (!match.ok) return 0;
  const row = (await match.json())?.[0];
  if (!row?.season_id) return 0;
  let waived = 0;
  for (const teamId of [row.team_a_id, row.team_b_id]) {
    if (!teamId) continue;
    waived += await waiveDruTeamPayments(env, { seasonId: row.season_id, teamId }, fetchImpl);
  }
  return waived;
}
