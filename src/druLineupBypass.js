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

export function duplicateLineupIds(playerIds) {
  const ids = (playerIds || []).filter(Boolean);
  return ids.length > 0 && new Set(ids).size !== ids.length;
}

async function clearEmptyDruLineups(fetchWithSchema, conn, teamId, privateHeaders) {
  const lineupResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?team_id=eq.${teamId}&select=id`, { headers: privateHeaders });
  const lineups = lineupResponse.ok ? await lineupResponse.json() : [];
  const slotResponse = await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?team_id=eq.${teamId}&select=lineup_id,player_id`, { headers: privateHeaders });
  const slots = slotResponse.ok ? await slotResponse.json() : [];
  const rows = [
    ...lineups.map((lineup) => ({ id: lineup.id, lineup_id: lineup.id })),
    ...slots,
  ];
  for (const lineupId of emptyLineupIds(rows)) {
    await fetchWithSchema(`${conn.base}/rest/v1/team_lineup_slots?lineup_id=eq.${lineupId}`, { method: 'DELETE', headers: privateHeaders });
    await fetchWithSchema(`${conn.base}/rest/v1/team_lineups?id=eq.${lineupId}`, { method: 'DELETE', headers: privateHeaders });
  }
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
  await clearEmptyDruLineups(fetchWithSchema, conn, teamId, privateHeaders);
  const roster = [...new Set([playerId, ...playerIds.filter(Boolean)])];
  const now = new Date().toISOString();
  for (const rosterPlayerId of roster) {
    await fetchWithSchema(`${conn.base}/rest/v1/team_memberships?season_id=eq.${seasonId}&player_id=eq.${rosterPlayerId}&ends_at=is.null`, {
      method: 'PATCH', headers, body: JSON.stringify({ ends_at: now }),
    });
    const saved = await fetchWithSchema(`${conn.base}/rest/v1/team_memberships`, {
      method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: rosterPlayerId, role: rosterPlayerId === playerId ? 'captain' : 'player' }),
    });
    if (!membershipSeatOk(saved.status)) throw new Error(`Membership write failed: ${saved.status} ${(await saved.text()).slice(0, 180)}`);
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
  if (!membershipSeatOk(saved.status)) return false;
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
      body: JSON.stringify({ display_name: 'Kite String Fourth' }),
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
  let slotRows = both.ok ? await both.json() : [];
  const seen = new Set((slotRows || []).map((row) => row.team_id));
  if (!seen.has(match.team_a_id) || !seen.has(match.team_b_id)) {
    both = await fetchWithSchema(slotUrl, { headers: privateHeaders });
    slotRows = both.ok ? await both.json() : [];
  }
  const existing = await fetchWithSchema(`${conn.base}/rest/v1/player_matches?team_match_id=eq.${match.id}&select=id`, { headers });
  const already = existing.ok ? await existing.json() : [];
  if (!already.length && slotRows.length) {
    const byTeam = { [match.team_a_id]: [], [match.team_b_id]: [] };
    for (const row of slotRows) byTeam[row.team_id]?.push(row);
    const a = (byTeam[match.team_a_id] || []).sort((x, y) => x.slot_number - y.slot_number);
    const b = (byTeam[match.team_b_id] || []).sort((x, y) => x.slot_number - y.slot_number);
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
