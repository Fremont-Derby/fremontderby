import { privatePostgrestProfile, withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
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
  return inserted.ok;
}

export async function waiveDruLineupPlayers(env, { teamId, slots }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !teamId || !Array.isArray(slots) || slots.length === 0) return 0;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return 0;
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
    'content-profile': privatePostgrestProfile('dru'),
    prefer: 'resolution=merge-duplicates,return=minimal',
  };
  const teamResponse = await fetchWithSchema(`${base}/rest/v1/teams?id=eq.${teamId}&select=season_id`, { headers });
  if (!teamResponse.ok) return 0;
  const seasonId = (await teamResponse.json())?.[0]?.season_id;
  const playerIds = slots.map((slot) => slot?.playerId || slot?.player_id).filter(Boolean);
  if (!seasonId || playerIds.length === 0) return 0;
  const inserted = await fetchWithSchema(`${base}/rest/v1/payment_status?on_conflict=season_id,player_id`, {
    method: 'POST',
    headers,
    body: JSON.stringify(playerIds.map((playerId) => ({
      season_id: seasonId,
      player_id: playerId,
      status: 'waived',
      amount_due_cents: 0,
      amount_paid_cents: 0,
    }))),
  });
  return inserted.ok ? playerIds.length : 0;
}
