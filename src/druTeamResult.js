import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export function teamWinnerId(match, playerMatches, forfeits = []) {
  if (!match?.team_a_id || !match?.team_b_id) return null;
  const rows = (playerMatches || []).filter((row) => ['finalized', 'corrected'].includes(row.status) && ['A', 'B'].includes(row.winner_side));
  if (!rows.length || rows.length !== (playerMatches || []).length) return null;
  let a = 0;
  let b = 0;
  for (const row of rows) {
    if (row.winner_side === 'A') a += 1;
    if (row.winner_side === 'B') b += 1;
  }
  for (const slot of forfeits) {
    if (slot.team_id === match.team_a_id) b += 1;
    if (slot.team_id === match.team_b_id) a += 1;
  }
  if (a === b) return null;
  return a > b ? match.team_a_id : match.team_b_id;
}


export function practicePlayoffsReady(matches) {
  return (matches || []).some((row) => row.status === 'finalized' && row.winner_team_id);
}

export async function closeFinishedDruTeamMatches(env, { seasonId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&status=neq.finalized&select=id,team_a_id,team_b_id,status`, { headers });
  if (!matchesResponse.ok) return 0;
  const matches = await matchesResponse.json();
  let closed = 0;
  for (const match of matches || []) {
    const playersResponse = await fetchWithSchema(`${base}/rest/v1/player_matches?team_match_id=eq.${match.id}&select=status,winner_side`, { headers });
    if (!playersResponse.ok) continue;
    const playerMatches = await playersResponse.json();
    const privateHeaders = { ...headers, 'accept-profile': privatePostgrestProfile('dru'), 'content-profile': privatePostgrestProfile('dru') };
    const slotResponse = await fetchWithSchema(`${base}/rest/v1/team_lineup_slots?team_id=in.(${match.team_a_id},${match.team_b_id})&player_id=is.null&select=team_id`, { headers: privateHeaders });
    const forfeits = slotResponse.ok ? await slotResponse.json() : [];
    const winner = teamWinnerId(match, playerMatches, forfeits);
    if (!winner) continue;
    const saved = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${match.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'finalized', winner_team_id: winner }),
    });
    if (saved.ok) closed += 1;
  }
  return closed;
}
