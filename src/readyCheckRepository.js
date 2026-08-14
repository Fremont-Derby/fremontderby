import { withSupabaseSchema } from './supabaseSchema.js';

function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
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
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message || payload?.error;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return payload;
}

export function createReadyCheckRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);
  requireEnvValue(env, 'SUPABASE_URL');
  requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');

  return {
    async start({ actorUserId, teamId, roundId }) {
      const row = await rpc(fetchImpl, env, 'start_team_ready_check', {
        actor_user_id: actorUserId,
        target_team_id: teamId,
        target_round_id: roundId,
      });
      return Array.isArray(row) ? row[0] : row;
    },
    async respond({ actorUserId, readyCheckId, response }) {
      const row = await rpc(fetchImpl, env, 'respond_team_ready_check', {
        actor_user_id: actorUserId,
        target_ready_check_id: readyCheckId,
        response_value: response,
      });
      return Array.isArray(row) ? row[0] : row;
    },
    async listPending({ actorUserId }) {
      const rows = await rpc(fetchImpl, env, 'list_my_pending_ready_checks', {
        actor_user_id: actorUserId,
      });
      return Array.isArray(rows) ? rows : rows ? [rows] : [];
    },
  };
}
