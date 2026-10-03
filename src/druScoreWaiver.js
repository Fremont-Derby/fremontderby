import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export async function waiveDruRaceBeforeScore(env, playerMatchId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !playerMatchId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
  const matchResponse = await fetchWithSchema(`${base}/rest/v1/player_matches?id=eq.${playerMatchId}&select=team_match_id,player_a_id,player_b_id`, { headers });
  if (!matchResponse.ok) return 0;
  const match = (await matchResponse.json())?.[0];
  if (!match?.team_match_id) return 0;
  const teamResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${match.team_match_id}&select=season_id,team_a_id,team_b_id`, { headers });
  if (!teamResponse.ok) return 0;
  const team = (await teamResponse.json())?.[0];
  if (!team?.season_id) return 0;
  const members = await fetchWithSchema(`${base}/rest/v1/team_memberships?season_id=eq.${team.season_id}&team_id=in.(${team.team_a_id},${team.team_b_id})&ends_at=is.null&select=player_id`, { headers });
  const rows = members.ok ? await members.json() : [];
  const ids = [...new Set([match.player_a_id, match.player_b_id, ...(Array.isArray(rows) ? rows : []).map((row) => row.player_id)].filter(Boolean))];
  if (!ids.length) return 0;
  const saved = await fetchWithSchema(`${base}/rest/v1/payment_status?on_conflict=season_id,player_id`, {
    method: 'POST',
    headers: { ...headers, 'content-profile': privatePostgrestProfile('dru'), 'accept-profile': privatePostgrestProfile('dru'), prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(ids.map((playerId) => ({ season_id: team.season_id, player_id: playerId, status: 'waived', amount_due_cents: 0, amount_paid_cents: 0, updated_at: new Date().toISOString() }))),
  });
  return saved.ok ? ids.length : 0;
}
