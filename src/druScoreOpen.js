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

export async function openDruMatchForScoring(env, matchId, fetchImpl = globalThis.fetch) {
  if (String(env?.ENVIRONMENT || '').trim() !== 'dru') return { opened: 0 };
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key || !matchId) return { opened: 0 };
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const existing = await fetchImpl(`${base}/rest/v1/player_matches?team_match_id=eq.${matchId}&select=id,slot_number`, { headers });
  const rows = existing.ok ? await existing.json() : [];
  const have = new Set((Array.isArray(rows) ? rows : []).map((row) => Number(row.slot_number)));
  const inserts = [1, 2, 3].filter((slot) => !have.has(slot)).map((slot) => ({ team_match_id: matchId, slot_number: slot, status: 'scheduled' }));
  if (!inserts.length) return { opened: rows.length };
  const saved = await fetchImpl(`${base}/rest/v1/player_matches`, { method: 'POST', headers, body: JSON.stringify(inserts) });
  return { opened: saved.ok ? inserts.length : 0 };
}
