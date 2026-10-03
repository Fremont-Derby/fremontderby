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
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const privateHeaders = { ...headers, 'accept-profile': privatePostgrestProfile('dru'), 'content-profile': privatePostgrestProfile('dru') };
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&or=(status.neq.finalized,winner_team_id.is.null)&select=id,team_a_id,team_b_id,status,winner_team_id`, { headers });
  if (!matchesResponse.ok) return 0;
  const matches = await matchesResponse.json();
  if (!matches?.length) return 0;
  const ids = matches.map((match) => match.id).join(',');
  const teamIds = [...new Set(matches.flatMap((match) => [match.team_a_id, match.team_b_id]).filter(Boolean))].join(',');
  const [playersResponse, slotResponse] = await Promise.all([
    fetchWithSchema(`${base}/rest/v1/player_matches?team_match_id=in.(${ids})&select=team_match_id,status,winner_side`, { headers }),
    fetchWithSchema(`${base}/rest/v1/team_lineup_slots?team_id=in.(${teamIds})&player_id=is.null&select=team_id`, { headers: privateHeaders }),
  ]);
  if (!playersResponse.ok) return 0;
  const playerMatches = await playersResponse.json();
  const forfeits = slotResponse.ok ? await slotResponse.json() : [];
  let closed = 0;
  for (const match of matches) {
    const rows = playerMatches.filter((row) => row.team_match_id === match.id);
    const winner = teamWinnerId(match, rows, forfeits.filter((slot) => slot.team_id === match.team_a_id || slot.team_id === match.team_b_id));
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

export async function closeOpenDruPracticeMatches(env, seasonId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=representation' };
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&status=neq.finalized&select=id,team_a_id`, { headers });
  if (!matchesResponse.ok) return 0;
  const matches = await matchesResponse.json();
  if (!matches?.length) return 0;
  let closed = 0;
  for (const match of matches) {
    const saved = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${match.id}`, {
      method: 'PATCH',
      headers: { ...headers, prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'finalized', winner_team_id: match.team_a_id }),
    });
    if (saved.ok) closed += 1;
  }
  return closed;
}

export async function writeDruPracticeResults(env, seasonId, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&select=id,season_id,round_id,team_a_id,team_b_id`, { headers });
  if (!matchesResponse.ok) return 0;
  const matches = await matchesResponse.json();
  if (!matches?.length) return 0;
  const ids = matches.map((match) => match.id).join(',');
  const existingResponse = await fetchWithSchema(`${base}/rest/v1/player_matches?team_match_id=in.(${ids})&select=id,team_match_id,slot_number,status`, { headers });
  const existing = existingResponse.ok ? await existingResponse.json() : [];
  let written = 0;
  for (const row of existing) {
    if (row.status === 'finalized') continue;
    const saved = await fetchWithSchema(`${base}/rest/v1/player_matches?id=eq.${row.id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status: 'finalized', winner_side: 'A' }),
    });
    if (saved.ok) written += 1;
  }
  const have = new Set(existing.map((row) => `${row.team_match_id}:${row.slot_number}`));
  const inserts = [];
  for (const match of matches) {
    for (const slot of [1, 2, 3]) {
      if (have.has(`${match.id}:${slot}`)) continue;
      inserts.push({ team_match_id: match.id, slot_number: slot, status: 'finalized', winner_side: 'A' });
    }
  }
  if (inserts.length) {
    const saved = await fetchWithSchema(`${base}/rest/v1/player_matches`, { method: 'POST', headers, body: JSON.stringify(inserts) });
    if (!saved.ok) {
      const forfeits = [];
      for (const match of matches) {
        for (const slot of [1, 2, 3]) {
          if (have.has(`${match.id}:${slot}`)) continue;
          forfeits.push({ season_id: match.season_id, round_id: match.round_id, team_match_id: match.id, slot_number: slot, forfeiting_team_id: match.team_b_id, credited_team_id: match.team_a_id, reason: 'empty_lineup_slot' });
        }
      }
      const forfeitSaved = await fetchWithSchema(`${base}/rest/v1/team_match_forfeits`, { method: 'POST', headers, body: JSON.stringify(forfeits) });
      if (!forfeitSaved.ok) return { written, error: await forfeitSaved.text() };
      written += forfeits.length;
    } else written += inserts.length;
  }
  return { written };
}
