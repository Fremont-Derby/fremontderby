import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

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


export function duplicateLineupIds(playerIds) {
  const ids = (playerIds || []).filter(Boolean);
  return ids.length > 0 && new Set(ids).size !== ids.length;
}

export async function ensureDruActorCanLockLineup(env, { actorUserId, teamId, playerIds = [] }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !actorUserId || !teamId) return false;
  if (duplicateLineupIds(playerIds)) throw new Error('Lineup players must be unique.');
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
  const privateHeaders = { ...headers, 'accept-profile': privatePostgrestProfile('dru'), 'content-profile': privatePostgrestProfile('dru') };
  const slotResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?team_id=eq.${teamId}&select=lineup_id,player_id`, { headers: privateHeaders });
  const slots = slotResponse.ok ? await slotResponse.json() : [];
  const byLineup = new Map();
  for (const slot of slots) {
    const rows = byLineup.get(slot.lineup_id) || [];
    rows.push(slot);
    byLineup.set(slot.lineup_id, rows);
  }
  for (const [lineupId, rows] of byLineup) {
    if (rows.some((slot) => slot.player_id)) continue;
    await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?lineup_id=eq.${lineupId}`, { method: 'DELETE', headers: privateHeaders });
    await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?id=eq.${lineupId}`, { method: 'DELETE', headers: privateHeaders });
  }
  const roster = [...new Set([playerId, ...playerIds.filter(Boolean)])];
  const now = new Date().toISOString();
  for (const rosterPlayerId of roster) {
    await fetchWithSchema(`${conn.base}/rest/v1/team_memberships?season_id=eq.${seasonId}&player_id=eq.${rosterPlayerId}&ends_at=is.null`, {
      method: 'PATCH', headers, body: JSON.stringify({ ends_at: now }),
    });
    const saved = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships`, {
      method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: rosterPlayerId, role: rosterPlayerId === playerId ? 'captain' : 'player' }),
    });
    if (!saved.ok) throw new Error(`Membership write failed: ${saved.status} ${(await saved.text()).slice(0, 180)}`);
  }
  await waiveDruTeamPayments(env, { seasonId, teamId, playerIds: roster }, fetchImpl);
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
  const now = new Date().toISOString();
  await fetchWithSchema(`${conn.base}/rest/v1/team_memberships?season_id=eq.${seasonId}&player_id=eq.${playerId}&ends_at=is.null`, {
    method: 'PATCH', headers, body: JSON.stringify({ ends_at: now }),
  });
  const saved = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships`, {
    method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: playerId, role: 'captain' }),
  });
  if (!saved.ok) return false;
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
  if (!lineupResponse.ok) return null;
  const lineup = (await lineupResponse.json())?.[0];
  if (!lineup?.id) return null;
  const chosen = (slots || []).filter((slot) => slot?.playerId).slice(0, 4);
  await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?lineup_id=eq.${lineup.id}`, { method: 'DELETE', headers: privateHeaders });
  await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots`, {
    method: 'POST',
    headers: privateHeaders,
    body: JSON.stringify(chosen.map((slot, index) => ({ lineup_id: lineup.id, season_id: match.season_id, round_id: roundId, team_id: teamId, slot_number: index + 1, player_id: slot.playerId, participation_type: 'roster' }))),
  });
  return { lineupId: lineup.id, teamMatchId: match.id, slots: chosen.length };
}
