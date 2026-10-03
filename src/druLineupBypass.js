import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

function service(env) {
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return base && key ? { base, key } : null;
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

export function duplicateLineupIds(playerIds) {
  const ids = (playerIds || []).map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);
  return ids.length > 0 && new Set(ids).size !== ids.length;
}

export async function waiveDruTeamPayments(env, { seasonId, teamId, playerIds = [] }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId || !teamId) return 0;
  const conn = service(env);
  if (!conn) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: conn.key, authorization: `Bearer ${conn.key}`, accept: 'application/json', 'content-type': 'application/json' };
  const ids = [...new Set((playerIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!ids.length) return 0;
  const saved = await fetchWithSchema(`${conn.base}/rest/v1/payment_status?on_conflict=season_id,player_id`, {
    method: 'POST',
    headers: { ...headers, 'content-profile': privatePostgrestProfile('dru'), 'accept-profile': privatePostgrestProfile('dru'), prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(ids.map((playerId) => ({ season_id: seasonId, player_id: playerId, status: 'waived', amount_due_cents: 0, amount_paid_cents: 0, updated_at: new Date().toISOString() }))),
  });
  return saved.ok ? ids.length : 0;
}

export async function ensureDruActorCanLockLineup(env, { actorUserId, teamId, roundId, playerIds = [], slots }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env)) return false;
  if (!actorUserId || !teamId || !roundId) reject('Lineup could not be locked');
  if (Array.isArray(slots) && !lineupSlotsAreComplete(slots)) reject('Lineup needs three players before it can lock');
  const named = (Array.isArray(slots) ? lineupPlayerIds(slots) : playerIds).map((id) => String(id || '').trim()).filter(Boolean);
  if (duplicateLineupIds(named)) reject('Lineup players must be unique.');
  const unique = [];
  const seen = new Set();
  for (const id of named) {
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(id);
  }
  if (unique.length !== 3) reject('Lineup needs three players before it can lock');
  if (unique.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) reject('Lineup players must be real player ids');
  const conn = service(env);
  if (!conn) reject('Lineup could not be locked');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const headers = { apikey: conn.key, authorization: `Bearer ${conn.key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const teamResponse = await fetchWithSchema(`${conn.base}/rest/v1/teams?id=eq.${teamId}&select=season_id`, { headers });
  if (!teamResponse.ok) reject('Team could not be read before lock');
  const seasonId = (await teamResponse.json())?.[0]?.season_id;
  if (!seasonId) reject('Team could not be read before lock');
  const roster = unique;
  const memberResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships?season_id=eq.${seasonId}&ends_at=is.null&select=team_id,player_id`, { headers });
  if (!memberResponse.ok) reject('Team membership could not be read before lock');
  const members = await memberResponse.json();
  const sameId = (row, id) => String(row.player_id || '').trim().toLowerCase() === id.toLowerCase();
  const onTeam = (id, team) => members.some((row) => sameId(row, id) && row.team_id === team);
  if (roster.some((id) => members.some((row) => sameId(row, id) && row.team_id && row.team_id !== teamId))) reject('A lineup player is already on another team');
  const privateHeaders = { ...headers, 'accept-profile': privatePostgrestProfile('dru'), 'content-profile': privatePostgrestProfile('dru') };
  const [slotResponse, lineupResponse] = await Promise.all([
    fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?team_id=eq.${teamId}&select=lineup_id,player_id`, { headers: privateHeaders }),
    fetchWithSchema(`${conn.base}/rest/v1/team_lineups?team_id=eq.${teamId}&select=id,round_id`, { headers: privateHeaders }),
  ]);
  if (!lineupResponse.ok || !slotResponse.ok) reject('Lineup could not be read before lock');
  const savedSlots = await slotResponse.json();
  const players = new Map();
  for (const slot of savedSlots) {
    const id = String(slot.player_id || '').trim().toLowerCase();
    if (!id) continue;
    const seen = players.get(slot.lineup_id) || new Set();
    seen.add(id);
    players.set(slot.lineup_id, seen);
  }
  const filled = new Set([...players].filter(([, seen]) => seen.size >= 3).map(([id]) => id));
  const lineups = await lineupResponse.json();
  for (const lineup of lineups) {
    if (lineup.round_id !== roundId) continue;
    if (filled.has(lineup.id)) continue;
    const removedSlots = await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?lineup_id=eq.${lineup.id}`, { method: 'DELETE', headers: privateHeaders });
    if (!removedSlots.ok) reject('Empty lineup could not be cleared');
    const removed = await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?id=eq.${lineup.id}`, { method: 'DELETE', headers: privateHeaders });
    if (!removed.ok) reject('Empty lineup could not be cleared');
  }
  for (const rosterPlayerId of roster) {
    if (onTeam(rosterPlayerId, teamId)) continue;
    const saved = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships`, {
      method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: rosterPlayerId, role: 'player' }),
    });
    if (!saved.ok) reject(`Membership write failed: ${saved.status} ${(await saved.text()).slice(0, 180)}`);
  }
  const waived = await waiveDruTeamPayments(env, { seasonId, teamId, playerIds: roster }, fetchImpl);
  if (waived !== roster.length) reject('Lineup players could not be waived');
  return true;
}
