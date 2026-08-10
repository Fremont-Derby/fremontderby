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

function encodeFilterValue(value) {
  return encodeURIComponent(value);
}

export function createSupabaseSeasonRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async getSeason(seasonId) {
      const url = `${supabaseUrl}/rest/v1/seasons?id=eq.${encodeFilterValue(seasonId)}&select=id,status`;
      const rows = await requestJson(fetchImpl, url, {
        method: 'GET',
        headers,
      });

      return rows?.[0] ?? null;
    },

    async listSeasonTeams(seasonId) {
      const url = `${supabaseUrl}/rest/v1/teams?season_id=eq.${encodeFilterValue(seasonId)}&select=id&order=name.asc`;
      return requestJson(fetchImpl, url, {
        method: 'GET',
        headers,
      });
    },

    async savePublishedSchedule(payload) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/publish_season_schedule`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_season_id: payload.seasonId,
          actor_user_id: payload.actorUserId,
          expected_previous_status: payload.previousStatus,
          rounds_payload: payload.rounds,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },
  };
}
