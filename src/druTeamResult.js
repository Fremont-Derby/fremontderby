import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export function teamWinnerId(match, playerMatches) {
  if (!match?.team_a_id || !match?.team_b_id) return null;
  const rows = (playerMatches || []).filter((row) => ['finalized', 'corrected'].includes(row.status) && ['A', 'B'].includes(row.winner_side));
  if (!rows.length || rows.length !== (playerMatches || []).length) return null;
  let a = 0;
  let b = 0;
  for (const row of rows) {
    if (row.winner_side === 'A') a += 1;
    if (row.winner_side === 'B') b += 1;
  }
  if (a === b) return match.team_a_id;
  return a > b ? match.team_a_id : match.team_b_id;
}

export function slotsToOpen(match, lineups, existing) {
  const have = new Set((existing || []).map((row) => row.slot_number));
  const a = (lineups || []).filter((row) => row.team_id === match.team_a_id && row.player_id);
  const b = (lineups || []).filter((row) => row.team_id === match.team_b_id && row.player_id);
  const opens = [];
  for (const slot of [1, 2, 3]) {
    if (have.has(slot)) continue;
    const left = a.find((row) => row.slot_number === slot);
    const right = b.find((row) => row.slot_number === slot);
    if (!left || !right) continue;
    opens.push({ slot_number: slot, player_a_id: left.player_id, player_b_id: right.player_id });
  }
  return opens;
}

export function practicePlayoffsReady(matches) {
  return (matches || []).some((row) => row.status === 'finalized' && row.winner_team_id);
}

export async function openDruLockedRaces(env, { seasonId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
  const privateHeaders = { ...headers, 'accept-profile': privatePostgrestProfile('dru') };
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&status=neq.finalized&select=id,round_id,team_a_id,team_b_id`, { headers });
  if (!matchesResponse.ok) return 0;
  const matches = await matchesResponse.json();
  if (!matches?.length) return 0;
  const teamIds = [...new Set(matches.flatMap((match) => [match.team_a_id, match.team_b_id]).filter(Boolean))].join(',');
  const roundIds = [...new Set(matches.map((match) => match.round_id).filter(Boolean))].join(',');
  const [lineupResponse, slotResponse, existingResponse] = await Promise.all([
    fetchWithSchema(`${base}/rest/v1/team_lineups?round_id=in.(${roundIds})&team_id=in.(${teamIds})&select=id,round_id,team_id`, { headers: privateHeaders }),
    fetchWithSchema(`${base}/rest/v1/team_lineup_slots?team_id=in.(${teamIds})&select=lineup_id,team_id,slot_number,player_id`, { headers: privateHeaders }),
    fetchWithSchema(`${base}/rest/v1/player_matches?team_match_id=in.(${matches.map((match) => match.id).join(',')})&select=team_match_id,slot_number`, { headers }),
  ]);
  if (!lineupResponse.ok || !slotResponse.ok) return 0;
  const lineups = await lineupResponse.json();
  const slots = await slotResponse.json();
  const existing = existingResponse.ok ? await existingResponse.json() : [];
  let opened = 0;
  for (const match of matches) {
    const lineupIds = new Set((lineups || []).filter((row) => row.round_id === match.round_id).map((row) => row.id));
    const rows = (slots || []).filter((slot) => lineupIds.has(slot.lineup_id));
    const opens = slotsToOpen(match, rows, (existing || []).filter((row) => row.team_match_id === match.id));
    for (const race of opens) {
      const saved = await fetchWithSchema(`${base}/rest/v1/player_matches`, {
        method: 'POST',
        headers: { ...headers, prefer: 'return=minimal' },
        body: JSON.stringify({ team_match_id: match.id, slot_number: race.slot_number, player_a_id: race.player_a_id, player_b_id: race.player_b_id, status: 'scheduled' }),
      });
      if (saved.ok) opened += 1;
    }
  }
  return opened;
}

export async function closeFinishedDruTeamMatches(env, { seasonId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId) return 0;
  await openDruLockedRaces(env, { seasonId }, fetchImpl);
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&or=(status.neq.finalized,winner_team_id.is.null)&select=id,team_a_id,team_b_id,status,winner_team_id`, { headers });
  if (!matchesResponse.ok) return 0;
  const matches = await matchesResponse.json();
  if (!matches?.length) return 0;
  const ids = matches.map((match) => match.id).join(',');
  const playersResponse = await fetchWithSchema(`${base}/rest/v1/player_matches?team_match_id=in.(${ids})&select=team_match_id,status,winner_side`, { headers });
  if (!playersResponse.ok) return 0;
  const playerMatches = await playersResponse.json();
  let closed = 0;
  for (const match of matches) {
    const rows = playerMatches.filter((row) => row.team_match_id === match.id);
    const winner = teamWinnerId(match, rows);
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
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?season_id=eq.${seasonId}&status=neq.finalized&select=id,team_a_id`, { headers });
  if (!matchesResponse.ok) return 0;
  const matches = await matchesResponse.json();
  if (!matches?.length) return 0;
  let closed = 0;
  for (const match of matches) {
    const saved = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${match.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'finalized', winner_team_id: match.team_a_id }),
    });
    if (saved.ok) closed += 1;
  }
  return closed;
}
