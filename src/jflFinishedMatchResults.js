import { withSupabaseSchema } from './supabaseSchema.js';

function required(env, key) {
  const value = env?.[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function headersFor(key) {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

async function getJson(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { method: 'GET', headers });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) throw new Error(`Supabase request failed with ${response.status}`);
  return Array.isArray(body) ? body : [];
}

export async function enrichFinishedScheduleRounds(rounds, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const source = Array.isArray(rounds) ? rounds : [];
  const finished = source.flatMap((round) => round.matches || [])
    .filter((match) => ['finalized', 'corrected'].includes(String(match.status || '')) && match.teamMatchId);
  if (!finished.length) return source;

  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const supabaseUrl = required(env, 'SUPABASE_URL').replace(/\/+$/, '');
  const headers = headersFor(required(env, 'SUPABASE_SERVICE_ROLE_KEY'));
  const ids = finished.map((match) => match.teamMatchId);
  const playerMatchParams = new URLSearchParams({
    select: 'team_match_id,slot_number,player_a_id,player_b_id,score_a,score_b,race_to_a,race_to_b,winner_side,status',
    team_match_id: `in.(${ids.join(',')})`,
    order: 'team_match_id.asc,slot_number.asc',
  });
  const playerMatchRows = await getJson(fetchImpl, `${supabaseUrl}/rest/v1/player_matches?${playerMatchParams}`, headers);
  const playerIds = [...new Set(playerMatchRows.flatMap((row) => [row.player_a_id, row.player_b_id]).filter(Boolean))];
  const playersById = new Map();
  if (playerIds.length) {
    const playerParams = new URLSearchParams({ select: 'id,display_name', id: `in.(${playerIds.join(',')})` });
    const players = await getJson(fetchImpl, `${supabaseUrl}/rest/v1/players?${playerParams}`, headers);
    for (const player of players) playersById.set(player.id, player.display_name || 'Player');
  }

  const rowsByMatch = new Map();
  for (const row of playerMatchRows) {
    const list = rowsByMatch.get(row.team_match_id) || [];
    list.push({
      slotNumber: row.slot_number,
      playerAName: playersById.get(row.player_a_id) || 'Player',
      playerBName: playersById.get(row.player_b_id) || 'Player',
      scoreA: row.score_a,
      scoreB: row.score_b,
      raceToA: row.race_to_a,
      raceToB: row.race_to_b,
      winnerSide: String(row.winner_side || '').toLowerCase(),
      status: row.status,
    });
    rowsByMatch.set(row.team_match_id, list);
  }

  return source.map((round) => ({
    ...round,
    matches: (round.matches || []).map((match) => {
      const playerResults = rowsByMatch.get(match.teamMatchId) || [];
      if (!playerResults.length) return match;
      const teamAScore = playerResults.filter((row) => row.winnerSide === 'a').length;
      const teamBScore = playerResults.filter((row) => row.winnerSide === 'b').length;
      return { ...match, teamAScore, teamBScore, playerResults };
    }),
  }));
}
