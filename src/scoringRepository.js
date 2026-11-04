import { withSupabaseSchema } from './supabaseSchema.js';
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
  fetchImpl = withSupabaseSchema(fetchImpl, env);

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  async function rpc(name, body) {
    const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return Array.isArray(result) ? result[0] : result;
  }

  return {
    getPlayerMatchScorecard({ actorUserId, playerMatchId }) {
      return rpc('get_player_match_scorecard', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    getPlayerMatchLiveContext({ actorUserId, playerMatchId }) {
      return rpc('get_player_match_live_context', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    recordPlayerMatchRack({ actorUserId, playerMatchId, winnerSide }) {
      return rpc('record_player_match_rack', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
        rack_winner_side: winnerSide,
      });
    },

    undoPlayerMatchRack({ actorUserId, playerMatchId }) {
      return rpc('undo_player_match_rack', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    finalizePlayerMatch({ actorUserId, playerMatchId }) {
      return rpc('finalize_player_match', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },

    correctPlayerMatch({
      actorUserId,
      playerMatchId,
      winnerSide,
      scoreA,
      scoreB,
      reason,
      racks,
    }) {
      return rpc('correct_player_match', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
        corrected_winner_side: winnerSide,
        corrected_score_a: scoreA,
        corrected_score_b: scoreB,
        correction_reason_text: reason,
        corrected_racks: racks,
      });
    },
  };
}
