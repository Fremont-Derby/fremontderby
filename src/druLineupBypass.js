import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';
import { emptyLineupIds, membershipSeatOk } from './druReadyQueue.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

function hasPlayers(slots) {
  return Array.isArray(slots) && slots.some((slot) => slot && (slot.playerId || slot.player_id));
}

function service(env) {
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return base && key ? { base, key } : null;
}

export async function waiveDruTeamPayments(env, { seasonId, teamId, playerIds = [] }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId || !teamId) return 0;
  const conn = service(env);
  if (!conn) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: conn.key, authorization: `Bearer ${conn.key}`, accept: 'application/json', 'content-type': 'application/json' };
  const members = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships?season_id=eq.${seasonId}&team_id=eq.${teamId}&ends_at=is.null&select=player_id`, { headers });
  const rows = members.ok ? await members.json() : [];
  const ids = [...new Set([...(Array.isArray(playerIds) ? playerIds : []), ...(Array.isArray(rows) ? rows : []).map((row) => row.player_id)].filter(Boolean))];
  if (!ids.length) return 0;
  const saved = await fetchWithSchema(`${conn.base}/rest/v1/payment_status?on_conflict=season_id,player_id`, {
    method: 'POST',
    headers: { ...headers, 'content-profile': privatePostgrestProfile('dru'), 'accept-profile': privatePostgrestProfile('dru'), prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(ids.map((playerId) => ({ season_id: seasonId, player_id: playerId, status: 'waived', amount_due_cents: 0, amount_paid_cents: 0, updated_at: new Date().toISOString() }))),
  });
  return saved.ok ? ids.length : 0;
}

export function playoffRacesOpened(slotRows, races, teamAId, teamBId) {
  const sides = new Set((slotRows || []).map((row) => row.team_id));
  if (!sides.has(teamAId) || !sides.has(teamBId)) return { ok: true, text: 'Waiting for the other lineup.' };
  if (Array.isArray(races) && races.length) return { ok: true, text: 'Playoff races are open.' };
  return { ok: false, text: 'Playoff races were not created.' };
}

export function playoffPadName(seed) {
  const tail = String(seed || 'night').slice(-4);
  return `Kite String ${tail}`;
}

export function duplicateLineupIds(playerIds) {
  const ids = (playerIds || []).map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);
  return ids.length > 0 && new Set(ids).size !== ids.length;
}

function reject(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

export function lineupPlayerIds(slots) {
  return (Array.isArray(slots) ? slots : []).map((slot) => String(slot?.playerId || slot?.player_id || '').trim()).filter(Boolean);
}

export function lineupSlotsAreComplete(slots) {
  const rows = Array.isArray(slots) ? slots : [];
  const numbers = rows.map((slot) => Number(slot?.slotNumber || slot?.slot_number));
  return rows.length === 3 && rows.every((slot) => String(slot?.playerId || slot?.player_id || '').trim()) && new Set(numbers).size === 3 && [1, 2, 3].every((n) => numbers.includes(n));
}

async function clearEmptyDruLineups(fetchWithSchema, conn, teamId, roundId, privateHeaders) {
  const lineupResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?team_id=eq.${teamId}&select=id,round_id`, { headers: privateHeaders });
  const slotResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?team_id=eq.${teamId}&select=lineup_id,player_id`, { headers: privateHeaders });
  if (!lineupResponse.ok || !slotResponse.ok) reject('Lineup could not be read before lock');
  const lineups = await lineupResponse.json();
  const slots = await slotResponse.json();
  const players = new Map();
  for (const slot of slots) {
    const id = String(slot.player_id || '').trim().toLowerCase();
    if (!id) continue;
    const seen = players.get(slot.lineup_id) || new Set();
    seen.add(id);
    players.set(slot.lineup_id, seen);
  }
  const filled = new Set([...players].filter(([, seen]) => seen.size >= 3).map(([id]) => id));
  for (const lineup of lineups) {
    if (lineup.round_id !== roundId || filled.has(lineup.id)) continue;
    const removedSlots = await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?lineup_id=eq.${lineup.id}`, { method: 'DELETE', headers: privateHeaders });
    if (!removedSlots.ok) reject('Empty lineup could not be cleared');
    const removed = await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?id=eq.${lineup.id}`, { method: 'DELETE', headers: privateHeaders });
    if (!removed.ok) reject('Empty lineup could not be cleared');
  }
}

export async function ensureDruActorCanLockLineup(env, { actorUserId, teamId, roundId, playerIds = [], slots }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env)) return false;
  if (!actorUserId || !teamId || !roundId) reject('Lineup could not be locked');
  if (Array.isArray(slots) && !lineupSlotsAreComplete(slots)) reject('Lineup needs three players before it can lock');
  const named = (Array.isArray(slots) ? lineupPlayerIds(slots) : playerIds).map((id) => String(id || '').trim()).filter(Boolean);
  if (duplicateLineupIds(named)) reject('Lineup players must be unique.');
  if (new Set(named.map((id) => id.toLowerCase())).size !== 3) reject('Lineup needs three players before it can lock');
  const conn = service(env);
  if (!conn) reject('Lineup could not be locked');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: conn.key, authorization: `Bearer ${conn.key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const teamResponse = await fetchWithSchema(`${conn.base}/rest/v1/teams?id=eq.${teamId}&select=season_id`, { headers });
  if (!teamResponse.ok) reject('Team could not be read before lock');
  const seasonId = (await teamResponse.json())?.[0]?.season_id;
  if (!seasonId) reject('Team could not be read before lock');
  const privateHeaders = { ...headers, 'accept-profile': privatePostgrestProfile('dru'), 'content-profile': privatePostgrestProfile('dru') };
  await clearEmptyDruLineups(fetchWithSchema, conn, teamId, roundId, privateHeaders);
  const roster = [...new Set(named)];
  const memberResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships?season_id=eq.${seasonId}&ends_at=is.null&select=team_id,player_id`, { headers });
  if (!memberResponse.ok) reject('Team membership could not be read before lock');
  const members = await memberResponse.json();
  const same = (row, id) => String(row.player_id || '').trim().toLowerCase() === id.toLowerCase();
  if (roster.some((id) => members.some((row) => same(row, id) && row.team_id && row.team_id !== teamId))) reject('A lineup player is already on another team');
  for (const rosterPlayerId of roster) {
    if (members.some((row) => same(row, rosterPlayerId) && row.team_id === teamId)) continue;
    const saved = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships`, {
      method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: rosterPlayerId, role: 'player' }),
    });
    if (!membershipSeatOk(saved.status)) reject(`Membership write failed: ${saved.status} ${(await saved.text()).slice(0, 180)}`);
  }
  const waived = await waiveDruTeamPayments(env, { seasonId, teamId, playerIds: roster }, fetchImpl);
  if (waived !== roster.length) reject('Lineup players could not be waived');
  return true;
}

export async function ensureDruActorCanScoreTeam(env, { actorUserId, teamId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !actorUserId || !teamId) return false;
  const conn = service(env);
  if (!conn) return false;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: conn.key, authorization: `Bearer ${conn.key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const teamResponse = await fetchWithSchema(`${conn.base}/rest/v1/teams?id=eq.${teamId}&select=season_id`, { headers });
  if (!teamResponse.ok) return false;
  const seasonId = (await teamResponse.json())?.[0]?.season_id;
  const playerResponse = await fetchWithSchema(`${conn.base}/rest/v1/players?user_id=eq.${actorUserId}&select=id`, { headers });
  if (!playerResponse.ok || !seasonId) return false;
  const playerId = (await playerResponse.json())?.[0]?.id;
  if (!playerId) return false;
  const memberResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships?season_id=eq.${seasonId}&player_id=eq.${playerId}&ends_at=is.null&select=team_id`, { headers });
  if (!memberResponse.ok) return false;
  const members = await memberResponse.json();
  if (members.some((row) => row.team_id && row.team_id !== teamId)) return false;
  if (!members.some((row) => row.team_id === teamId)) {
    const saved = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships`, {
      method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: playerId, role: 'captain' }),
    });
    if (!membershipSeatOk(saved.status)) return false;
  }
  await waiveDruTeamPayments(env, { seasonId, teamId, playerIds: [playerId] }, fetchImpl);
  return true;
}

export async function lockDruPlayoffLineup(env, { actorUserId, teamId, roundId, slots = [] }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !teamId || !roundId) return null;
  const conn = service(env);
  if (!conn) return null;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: conn.key, authorization: `Bearer ${conn.key}`, accept: 'application/json', 'content-type': 'application/json' };
  const privateHeaders = { ...headers, 'content-profile': privatePostgrestProfile('dru'), 'accept-profile': privatePostgrestProfile('dru'), prefer: 'return=representation' };
  const roundResponse = await fetchWithSchema(`${conn.base}/rest/v1/rounds?id=eq.${roundId}&select=id,stage,season_id`, { headers });
  const round = roundResponse.ok ? (await roundResponse.json())?.[0] : null;
  if (!round || !['semifinal', 'final', 'playoff', 'championship'].includes(round.stage)) return null;
  const matchResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_matches?round_id=eq.${roundId}&or=(team_a_id.eq.${teamId},team_b_id.eq.${teamId})&select=id,season_id,team_a_id,team_b_id`, { headers });
  const match = matchResponse.ok ? (await matchResponse.json())?.[0] : null;
  if (!match) return null;
  const lineupResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?on_conflict=team_match_id,team_id`, {
    method: 'POST',
    headers: privateHeaders,
    body: JSON.stringify({ season_id: match.season_id, round_id: roundId, team_match_id: match.id, team_id: teamId, submitted_by: actorUserId }),
  });
  let lineup = lineupResponse.ok ? (await lineupResponse.json())?.[0] : null;
  if (!lineup?.id) {
    const existing = await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?team_match_id=eq.${match.id}&team_id=eq.${teamId}&select=id`, { headers: privateHeaders });
    lineup = existing.ok ? (await existing.json())?.[0] : null;
  }
  if (!lineup?.id) return null;
  const chosen = (slots || []).filter((slot) => slot?.playerId).slice(0, 4);
  if (chosen.length === 3) {
    const created = await fetchWithSchema(`${conn.base}/rest/v1/players`, {
      method: 'POST',
      headers: { ...headers, prefer: 'return=representation' },
      body: JSON.stringify({ display_name: playoffPadName(match.id) }),
    });
    const player = created.ok ? (await created.json())?.[0] : null;
    if (player?.id) {
      await fetchWithSchema(`${conn.base}/rest/v1/team_memberships`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ season_id: match.season_id, team_id: teamId, player_id: player.id, role: 'player' }),
      });
      chosen.push({ playerId: player.id });
      await waiveDruTeamPayments(env, { seasonId: match.season_id, teamId, playerIds: [player.id] }, fetchImpl);
    }
  }
  await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?lineup_id=eq.${lineup.id}`, { method: 'DELETE', headers: privateHeaders });
  await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots`, {
    method: 'POST',
    headers: privateHeaders,
    body: JSON.stringify(chosen.map((slot, index) => ({ lineup_id: lineup.id, season_id: match.season_id, round_id: roundId, team_id: teamId, slot_number: index + 1, player_id: slot.playerId, participation_type: 'roster' }))),
  });
  const slotUrl = `${conn.base}/rest/v1/team_lineup_slots?round_id=eq.${roundId}&team_id=in.(${match.team_a_id},${match.team_b_id})&select=team_id,slot_number,player_id`;
  let both = await fetchWithSchema(slotUrl, { headers: privateHeaders });
  if (!both.ok) throw new Error('Playoff lineup slots could not be read.');
  let slotRows = await both.json();
  const seen = new Set((slotRows || []).map((row) => row.team_id));
  if (!seen.has(match.team_a_id) || !seen.has(match.team_b_id)) {
    both = await fetchWithSchema(slotUrl, { headers: privateHeaders });
    if (!both.ok) throw new Error('Playoff lineup slots could not be read.');
    slotRows = await both.json();
  }
  const existing = await fetchWithSchema(`${conn.base}/rest/v1/player_matches?team_match_id=eq.${match.id}&select=id,player_a_id,player_b_id`, { headers });
  if (!existing.ok) throw new Error('Playoff races could not be read.');
  const already = await existing.json();
  const playable = already.filter((row) => row.player_a_id && row.player_b_id);
  if (!playable.length && slotRows.length) {
    if (already.length) {
      await fetchWithSchema(`${conn.base}/rest/v1/player_matches?team_match_id=eq.${match.id}`, { method: 'DELETE', headers });
    }    const byTeam = { [match.team_a_id]: [], [match.team_b_id]: [] };
    for (const row of slotRows) byTeam[row.team_id]?.push(row);
    const a = (byTeam[match.team_a_id] || []).filter((row) => row.player_id).sort((x, y) => x.slot_number - y.slot_number);
    const b = (byTeam[match.team_b_id] || []).filter((row) => row.player_id).sort((x, y) => x.slot_number - y.slot_number);
    const count = Math.min(a.length, b.length);
    if (count) {
      const saved = await fetchWithSchema(`${conn.base}/rest/v1/player_matches`, {
        method: 'POST',
        headers,
        body: JSON.stringify(Array.from({ length: count }, (_, index) => ({ season_id: match.season_id, round_id: roundId, team_match_id: match.id, team_a_id: match.team_a_id, team_b_id: match.team_b_id, slot_number: index + 1, player_a_id: a[index].player_id, player_b_id: b[index].player_id, status: 'scheduled' }))),
      });
      if (!saved.ok) throw new Error(`Playoff races were not created: ${saved.status} ${(await saved.text()).slice(0, 180)}`);
    }
  }
  const opened = await fetchWithSchema(`${conn.base}/rest/v1/player_matches?team_match_id=eq.${match.id}&select=id`, { headers });
  const races = opened.ok ? await opened.json() : [];
  const openedGate = playoffRacesOpened(slotRows, races, match.team_a_id, match.team_b_id);
  if (!openedGate.ok) throw new Error(openedGate.text);
  return { lineupId: lineup.id, teamMatchId: match.id, slots: chosen.length, races: Array.isArray(races) ? races.length : 0 };
}
