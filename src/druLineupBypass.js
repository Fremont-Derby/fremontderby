import { withSupabaseSchema } from './supabaseSchema.js';

function druOnly(env) {
  return String(env?.ENVIRONMENT || '').trim() === 'dru';
}

export async function ensureDruActorCanLockLineup(env, { actorUserId, teamId }, fetchImpl = globalThis.fetch) {
  if (!druOnly(env) || !actorUserId || !teamId) return false;
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return false;
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json', 'content-type': 'application/json' };
  const playerResponse = await fetchWithSchema(`${base}/rest/v1/players?user_id=eq.${actorUserId}&select=id`, { headers });
  if (!playerResponse.ok) return false;
  const players = await playerResponse.json();
  const playerId = players?.[0]?.id;
  if (!playerId) return false;
  const now = new Date().toISOString();
  await fetchWithSchema(`${base}/rest/v1/team_memberships?player_id=eq.${playerId}&role=eq.captain&ends_at=is.null`, {
    method: 'PATCH', headers, body: JSON.stringify({ ends_at: now }),
  });
  await fetchWithSchema(`${base}/rest/v1/team_memberships?team_id=eq.${teamId}&role=eq.captain&ends_at=is.null`, {
    method: 'PATCH', headers, body: JSON.stringify({ ends_at: now }),
  });
  const inserted = await fetchWithSchema(`${base}/rest/v1/team_memberships`, {
    method: 'POST', headers, body: JSON.stringify({ team_id: teamId, player_id: playerId, role: 'captain' }),
  });
  return inserted.ok;
}
