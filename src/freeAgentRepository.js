function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function jsonHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
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

async function requestJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const body = await parseResponse(response);

  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }

  return body;
}

export function createFreeAgentRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async registerFreeAgent({ actorUserId, seasonId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/register_free_agent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_season_id: seasonId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async setFreeAgentAvailability({ actorUserId, roundId, availabilityStatus }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/set_free_agent_availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_round_id: roundId,
          availability_status: availabilityStatus,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },
  };
}
