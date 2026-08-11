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

async function invokeRpc(fetchImpl, supabaseUrl, headers, rpcName, body) {
  const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const parsed = await parseResponse(response);
  if (!response.ok) {
    const message = typeof parsed === 'string' ? parsed : parsed?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return Array.isArray(parsed) ? parsed[0] ?? null : parsed;
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
      return invokeRpc(fetchImpl, supabaseUrl, headers, 'start_season_playoffs', {
        target_season_id: seasonId,
        actor_user_id: actorUserId,
      });
    },

    async advanceSeasonToChampionship({ seasonId, actorUserId }) {
      return invokeRpc(fetchImpl, supabaseUrl, headers, 'advance_season_to_championship', {
        target_season_id: seasonId,
        actor_user_id: actorUserId,
      });
    },
  };
}
