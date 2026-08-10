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

export function createPlayoffRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };

  return {
    async startSeasonPlayoffs({ seasonId, actorUserId }) {
      const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/start_season_playoffs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_season_id: seasonId,
          actor_user_id: actorUserId,
        }),
      });
      const body = await parseResponse(response);
      if (!response.ok) {
        const message = typeof body === 'string' ? body : body?.message;
        throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
      }
      return Array.isArray(body) ? body[0] ?? null : body;
    },
  };
}
