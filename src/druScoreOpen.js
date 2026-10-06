export function openScoringLabel() {
  return 'Open this match for scoring';
}

export function finishRemainingLabel() {
  return 'Finish remaining regular matches';
}

export function scoreRowsForMatch(match, races = []) {
  const rows = Array.isArray(races) && races.length ? races : [1, 2, 3].map((slot) => ({ slot_number: slot }));
  return rows.map((race) => ({
    player_match_id: race.id || race.player_match_id || `${match.id}:${race.slot_number || 1}`,
    team_match_id: match.id,
    team_a_name: match.team_a_name || 'Team A',
    team_b_name: match.team_b_name || 'Team B',
    scoring_team_id: match.team_a_id,
    scoring_team_name: match.team_a_name || 'Team A',
    player_a_name: race.player_a_name || match.team_a_name || 'Home',
    player_b_name: race.player_b_name || match.team_b_name || 'Away',
    round_number: match.round_number || 1,
    slot_number: race.slot_number || 1,
    status: race.status || 'scheduled',
    scheduled_on: match.scheduled_on || null,
  }));
}

export function mergeScorableMatches(existing, opened) {
  const rows = Array.isArray(existing) ? existing.slice() : [];
  const seen = new Set(rows.map((row) => row.player_match_id));
  for (const row of opened || []) {
    if (!row.player_match_id || seen.has(row.player_match_id)) continue;
    seen.add(row.player_match_id);
    rows.push(row);
  }
  return rows;
}

export function raceInserts(match, homeIds, awayIds) {
  const slots = Math.min(homeIds.length, awayIds.length, 3);
  return Array.from({ length: slots }, (_, index) => ({
    season_id: match.season_id,
    round_id: match.round_id,
    team_match_id: match.id,
    slot_number: index + 1,
    team_a_id: match.team_a_id,
    team_b_id: match.team_b_id,
    player_a_id: homeIds[index],
    player_b_id: awayIds[index],
    status: 'scheduled',
  }));
}

export async function openDruMatchForScoring(env, matchId, fetchImpl = globalThis.fetch) {
  if (String(env?.ENVIRONMENT || '').trim() !== 'dru') return { opened: 0, error: 'Not a DRU lane.' };
  const { withSupabaseSchema } = await import('./supabaseSchema.js');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || !matchId) return { opened: 0, error: 'Match could not be opened.' };
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=representation' };
  const matchResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${matchId}&select=id,season_id,round_id,team_a_id,team_b_id`, { headers });
  if (!matchResponse.ok) return { opened: 0, error: 'Match could not be read.' };
  const match = (await matchResponse.json())?.[0];
  if (!match) return { opened: 0, error: 'Match could not be read.' };
  const membersResponse = await fetchWithSchema(`${base}/rest/v1/team_memberships?season_id=eq.${match.season_id}&ends_at=is.null&team_id=in.(${match.team_a_id},${match.team_b_id})&select=team_id,player_id`, { headers });
  if (!membersResponse.ok) return { opened: 0, error: 'Roster could not be read.' };
  const members = await membersResponse.json();
  const idsFor = (teamId) => [...new Set(members.filter((row) => row.team_id === teamId).map((row) => row.player_id).filter(Boolean))];
  const inserts = raceInserts(match, idsFor(match.team_a_id), idsFor(match.team_b_id));
  if (!inserts.length) return { opened: 0, error: 'Each team needs a player before this match can be scored.' };
  const existing = await fetchWithSchema(`${base}/rest/v1/player_matches?team_match_id=eq.${matchId}&select=id,slot_number`, { headers });
  const have = new Set((existing.ok ? await existing.json() : []).map((row) => Number(row.slot_number)));
  const missing = inserts.filter((row) => !have.has(row.slot_number));
  if (!missing.length) return { opened: have.size };
  const saved = await fetchWithSchema(`${base}/rest/v1/player_matches`, { method: 'POST', headers, body: JSON.stringify(missing) });
  if (!saved.ok) return { opened: 0, error: 'This match could not be opened for scoring.' };
  return { opened: missing.length };
}

export function acceptedWinnerSide(winnerSide) {
  return winnerSide === 'A' || winnerSide === 'B' ? winnerSide : '';
}

export function raceResultPatch(match, winnerSide) {
  if (winnerSide !== 'A' && winnerSide !== 'B') return null;
  return {
    status: 'finalized',
    winner_side: winnerSide,
    winner_player_id: winnerSide === 'A' ? match.player_a_id : match.player_b_id,
  };
}

export async function recordDruRaceResult(env, playerMatchId, winnerSide, fetchImpl = globalThis.fetch) {
  if (String(env?.ENVIRONMENT || '').trim() !== 'dru') return { saved: false, error: 'Not a DRU lane.' };
  const { withSupabaseSchema } = await import('./supabaseSchema.js');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || !playerMatchId) return { saved: false, error: 'This race could not be saved.' };
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=representation' };
  const matchResponse = await fetchWithSchema(`${base}/rest/v1/player_matches?id=eq.${playerMatchId}&select=id,player_a_id,player_b_id,status`, { headers });
  if (!matchResponse.ok) return { saved: false, error: 'This race could not be read.' };
  const match = (await matchResponse.json())?.[0];
  if (!match) return { saved: false, error: 'This race could not be read.' };
  const patch = raceResultPatch(match, winnerSide);
  const saved = await fetchWithSchema(`${base}/rest/v1/player_matches?id=eq.${playerMatchId}`, { method: 'PATCH', headers, body: JSON.stringify(patch) });
  if (!saved.ok) return { saved: false, error: 'This race could not be saved.' };
  return { saved: true, winnerSide: patch.winner_side };
}

export async function scoreDruTeamMatch(env, teamMatchId, winnerSide = 'A', fetchImpl = globalThis.fetch) {
  if (String(env?.ENVIRONMENT || '').trim() !== 'dru') return { saved: false, error: 'Not a DRU lane.' };
  const { withSupabaseSchema } = await import('./supabaseSchema.js');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || !teamMatchId) return { saved: false, status: 404, error: 'Match not found.' };
  const side = acceptedWinnerSide(winnerSide);
  if (!side) return { saved: false, status: 400, error: 'winnerSide must be A or B' };
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=representation' };
  await openDruMatchForScoring(env, teamMatchId, fetchImpl);
  const matchResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${teamMatchId}&select=id,team_a_id,team_b_id,status,winner_team_id`, { headers });
  const match = matchResponse.ok ? (await matchResponse.json())?.[0] : null;
  if (!match) return { saved: false, status: 404, error: 'Match not found.' };
  if (match.status === 'finalized') {
    if (match.winner_team_id) return { saved: false, status: 409, error: 'This match is already saved. A captain has to correct it.' };
    const winnerTeamId = side === 'A' ? match.team_a_id : match.team_b_id;
    const filled = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${teamMatchId}`, { method: 'PATCH', headers, body: JSON.stringify({ winner_team_id: winnerTeamId }) });
    if (!filled.ok) return { saved: false, error: 'This match could not be saved.' };
    return { saved: true, winnerSide: side, filledWinner: true };
  }
  const racesResponse = await fetchWithSchema(`${base}/rest/v1/player_matches?team_match_id=eq.${teamMatchId}&select=id,player_a_id,player_b_id`, { headers });
  const races = racesResponse.ok ? await racesResponse.json() : [];
  for (const race of races) {
    const saved = await fetchWithSchema(`${base}/rest/v1/player_matches?id=eq.${race.id}`, { method: 'PATCH', headers, body: JSON.stringify(raceResultPatch(race, side)) });
    if (!saved.ok) return { saved: false, error: 'A race could not be saved.' };
  }
  const winnerTeamId = side === 'A' ? match.team_a_id : match.team_b_id;
  const teamSaved = await fetchWithSchema(`${base}/rest/v1/team_matches?id=eq.${teamMatchId}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'finalized', winner_team_id: winnerTeamId }) });
  if (!teamSaved.ok) return { saved: false, error: 'This match could not be saved.' };
  return { saved: true, races: races.length, winnerSide: side };
}
