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

async function requestJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const body = await parseResponse(response);
  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return body;
}

export function createSeasonCloseRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };

  async function call(rpc, payload) {
    const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return Array.isArray(result) ? (result[0] ?? null) : result;
  }

  return {
    getCloseReadiness({ actorUserId, seasonId }) {
      return call('get_season_close_readiness', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
      });
    },
    closeSeason({ actorUserId, seasonId }) {
      return call('close_season', {
        actor_user_id: actorUserId,
        target_season_id: seasonId,
      });
    },
  };
}
