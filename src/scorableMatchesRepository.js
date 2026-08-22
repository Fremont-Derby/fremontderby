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
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createScorableMatchesRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  fetchImpl = withSupabaseSchema(fetchImpl, env);

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');

  return {
    async listScorableMatches({ actorUserId }) {
      const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/list_scorable_player_matches`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ actor_user_id: actorUserId }),
      });
      const body = await parseResponse(response);
      if (!response.ok) {
        const message = typeof body === 'string' ? body : body?.message;
        throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
      }
      return Array.isArray(body) ? body : [];
    },
  };
}
