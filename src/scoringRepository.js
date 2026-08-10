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

export function createScoringRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  return {
    async getPlayerMatchScorecard({ actorUserId, playerMatchId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/get_player_match_scorecard`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_player_match_id: playerMatchId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async recordPlayerMatchRack({ actorUserId, playerMatchId, winnerSide }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/record_player_match_rack`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_player_match_id: playerMatchId,
          rack_winner_side: winnerSide,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },

    async finalizePlayerMatch({ actorUserId, playerMatchId }) {
      const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/finalize_player_match`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actor_user_id: actorUserId,
          target_player_match_id: playerMatchId,
        }),
      });

      return Array.isArray(result) ? result[0] : result;
    },
  };
}
