import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

function hasPlayers(slots) {
  return Array.isArray(slots) && slots.some((slot) => slot && (slot.playerId || slot.player_id));
}

export async function waiveDruTeamPayments(env, { seasonId, teamId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !seasonId || !teamId) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
  const members = await fetchWithSchema(`${base}/rest/v1/team_memberships?season_id=eq.${seasonId}&team_id=eq.${teamId}&ends_at=is.null&select=player_id`, { headers });
  if (!members.ok) return 0;
  const rows = await members.json();
  const body = (Array.isArray(rows) ? rows : []).filter((row) => row.player_id).map((row) => ({
    season_id: seasonId,
    player_id: row.player_id,
    status: 'waived',
    amount_due_cents: 0,
    amount_paid_cents: 0,
    updated_at: new Date().toISOString(),
  }));
  if (!body.length) return 0;
  const saved = await fetchWithSchema(`${base}/rest/v1/payment_status?on_conflict=season_id,player_id`, {
    method: 'POST',
    headers: { ...headers, 'content-profile': privatePostgrestProfile('dru'), 'accept-profile': privatePostgrestProfile('dru'), prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body),
  });
  return saved.ok ? body.length : 0;
}

async function clearEmptyDruLineup(env, teamId, fetchImpl) {
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
    'accept-profile': privatePostgrestProfile('dru'),
    'content-profile': privatePostgrestProfile('dru'),
  };
  const response = await fetchWithSchema(`${base}/rest/v1/team_lineups?team_id=eq.${teamId}&select=id,slots`, { headers });
  const lineups = response.ok ? await response.json() : [];
  let cleared = 0;
  for (const lineup of lineups) {
    if (!hasPlayers(lineup.slots)) {
      const removed = await fetchWithSchema(`${base}/rest/v1/team_lineups?id=eq.${lineup.id}`, { method: 'DELETE', headers });
      if (removed.ok) cleared += 1;
    }
  }
  return cleared;
}

export async function ensureDruActorCanLockLineup(env, { actorUserId, teamId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !actorUserId || !teamId) return false;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return false;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json', prefer: 'return=minimal' };
  const teamResponse = await fetchWithSchema(`${base}/rest/v1/teams?id=eq.${teamId}&select=season_id`, { headers });
  if (!teamResponse.ok) return false;
  const seasonId = (await teamResponse.json())?.[0]?.season_id;
  const playerResponse = await fetchWithSchema(`${base}/rest/v1/players?user_id=eq.${actorUserId}&select=id`, { headers });
  if (!playerResponse.ok || !seasonId) return false;
  const playerId = (await playerResponse.json())?.[0]?.id;
  if (!playerId) return false;
  await clearEmptyDruLineup(env, teamId, fetchImpl);
  const now = new Date().toISOString();
  await fetchWithSchema(`${base}/rest/v1/team_memberships?season_id=eq.${seasonId}&player_id=eq.${playerId}&ends_at=is.null`, {
    method: 'PATCH', headers, body: JSON.stringify({ ends_at: now }),
  });
  await fetchWithSchema(`${base}/rest/v1/team_memberships?season_id=eq.${seasonId}&team_id=eq.${teamId}&role=eq.captain&ends_at=is.null`, {
    method: 'PATCH', headers, body: JSON.stringify({ ends_at: now }),
  });
  const inserted = await fetchWithSchema(`${base}/rest/v1/team_memberships`, {
    method: 'POST', headers, body: JSON.stringify({ season_id: seasonId, team_id: teamId, player_id: playerId, role: 'captain' }),
  });
  await waiveDruTeamPayments(env, { seasonId, teamId }, fetchImpl);
  return inserted.ok;
}
