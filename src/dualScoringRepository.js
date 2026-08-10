function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is required`);
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

export function createDualScoringRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  async function callRpc(name, body) {
    const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return Array.isArray(result) ? result[0] : result;
  }

  return {
    getPlayerMatchScoreComparison({ actorUserId, playerMatchId }) {
      return callRpc('get_player_match_score_comparison', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    recordPlayerMatchScoreRack({ actorUserId, playerMatchId, winnerSide }) {
      return callRpc('record_player_match_score_rack', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
        rack_winner_side: winnerSide,
      });
    },

    undoPlayerMatchScoreRack({ actorUserId, playerMatchId }) {
      return callRpc('undo_player_match_score_rack', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    confirmPlayerMatchScore({ actorUserId, playerMatchId }) {
      return callRpc('confirm_player_match_score', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    finalizeReconciledPlayerMatch({ actorUserId, playerMatchId }) {
      return callRpc('finalize_reconciled_player_match', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    adminOverrideReconciledPlayerMatch({ actorUserId, playerMatchId, reason, resolvedRacks }) {
      return callRpc('admin_override_reconciled_player_match', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
        resolution_reason_text: reason,
        resolved_racks: resolvedRacks,
      });
    },
  };
}
