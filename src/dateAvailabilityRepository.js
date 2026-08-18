import { withSupabaseSchema } from './supabaseSchema.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';
function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return stripTrailingSlashes(value);
}

async function rpc(fetchImpl, env, name, body) {
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetchImpl(
    `${normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'))}/rest/v1/rpc/${name}`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return Array.isArray(payload) ? payload[0] : payload;
}

export function createDateAvailabilityRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  // Fail closed at construction so missing lane secrets surface before first request.
  requireEnvValue(env, 'SUPABASE_URL');
  requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  return {
    getOwn({ actorUserId, seasonId, availabilityDate }) {
      return rpc(fetchImpl, env, 'get_own_date_availability', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        target_availability_date: availabilityDate,
      });
    },
    setOwn({ actorUserId, seasonId, availabilityDate, availabilityStatus }) {
      return rpc(fetchImpl, env, 'set_own_date_availability', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
        target_availability_date: availabilityDate,
        target_availability_status: availabilityStatus,
      });
    },
  };
}
