import { withSupabaseSchema } from './supabaseSchema.js';
function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export function createPlayerContactRepository(
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  const baseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };

  async function rpc(name, body) {
    const response = await fetchImpl(`${baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    const payload = await parseResponse(response);
    if (!response.ok) {
      const message = typeof payload === 'string' ? payload : payload?.message;
      const error = new Error(
        `Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`,
      );
      error.status = response.status;
      throw error;
    }
    return Array.isArray(payload) ? (payload[0] ?? null) : payload;
  }

  return {
    getOwn({ actorUserId }) {
      return rpc('get_own_player_phone', { actor_user_id: actorUserId });
    },
    setOwn({ actorUserId, phone }) {
      return rpc('set_own_player_phone', {
        actor_user_id: actorUserId,
        profile_phone: phone,
      });
    },
    getAdminPlayer({ actorUserId, playerId }) {
      return rpc('get_admin_player_phone', {
        actor_user_id: actorUserId,
        target_player_id: playerId,
      });
    },
  };
}
