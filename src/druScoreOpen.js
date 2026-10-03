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
