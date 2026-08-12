function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function headers(serviceRoleKey) {
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

async function rpc(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const body = await parseResponse(response);
  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message;
    throw new Error(`Supabase request failed with ${response.status}${message ? `: ${message}` : ''}`);
  }
  return body;
}

export function createPlayerClaimRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const requestHeaders = headers(serviceRoleKey);

  return {
    async getOptions({ actorUserId, search = '' }) {
      const result = await rpc(
        fetchImpl,
        `${supabaseUrl}/rest/v1/rpc/get_player_claim_options`,
        {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({ actor_user_id: actorUserId, search_text: search || null }),
        },
      );
      const row = Array.isArray(result) ? result[0] : result;
      return row?.options ?? { canClaim: true, reason: null, players: [] };
    },

    async claim({ actorUserId, playerId }) {
      const result = await rpc(
        fetchImpl,
        `${supabaseUrl}/rest/v1/rpc/claim_unclaimed_player`,
        {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({ actor_user_id: actorUserId, target_player_id: playerId }),
        },
      );
      const row = Array.isArray(result) ? result[0] : result;
      return row ? { playerId: row.player_id, displayName: row.display_name } : null;
    },
  };
}
