import { withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

function practiceSeasonName(name) {
  return /kids|demo/i.test(String(name || ''));
}

export async function ensureDruActorCanLockLineup(env, { actorUserId, teamId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !actorUserId || !teamId) return false;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return false;
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: 'application/json',
    'content-type': 'application/json',
    prefer: 'return=representation',
  };
  const playerResponse = await fetchWithSchema(`${base}/rest/v1/players?user_id=eq.${actorUserId}&select=id`, { headers });
  if (!playerResponse.ok) return false;
  const players = await playerResponse.json();
  const playerId = players?.[0]?.id;
  if (!playerId) return false;
  const teamResponse = await fetchWithSchema(`${base}/rest/v1/teams?id=eq.${teamId}&select=season_id`, { headers });
  if (!teamResponse.ok) return false;
  const seasonId = (await teamResponse.json())?.[0]?.season_id;
  if (!seasonId) return false;
  const seasonResponse = await fetchWithSchema(`${base}/rest/v1/seasons?id=eq.${seasonId}&select=name`, { headers });
  if (!seasonResponse.ok) return false;
  if (!practiceSeasonName((await seasonResponse.json())?.[0]?.name)) return false;
  const inserted = await fetchWithSchema(`${base}/rest/v1/team_memberships`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ team_id: teamId, player_id: playerId, role: 'captain' }),
  });
  return inserted.ok;
}
