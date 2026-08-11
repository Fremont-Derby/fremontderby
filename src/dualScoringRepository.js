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

export function createDualScoringRepository(env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const serviceRoleKey = requireEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY');
  const headers = jsonHeaders(serviceRoleKey);

  async function callRpc(name, body) {
    const result = await requestJson(fetchImpl, `${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    return Array.isArray(result) ? result[0] : result;
  }

  const scoringBody = ({ actorUserId, playerMatchId, scoringTeamId }) => ({
    actor_user_id: actorUserId,
    target_player_match_id: playerMatchId,
    target_scoring_team_id: scoringTeamId,
  });

  return {
    getPlayerMatchScoreComparison(input) {
      return callRpc('get_player_match_score_comparison', scoringBody(input));
    },
    getPlayerMatchLiveContext({ actorUserId, playerMatchId }) {
      return callRpc('get_player_match_live_context', {
        actor_user_id: actorUserId,
        target_player_match_id: playerMatchId,
      });
    },
    setPlayerMatchOpeningDiscipline({ actorUserId, playerMatchId, scoringTeamId, openingDiscipline }) {
      return callRpc('set_player_match_opening_discipline', {
        ...scoringBody({ actorUserId, playerMatchId, scoringTeamId }),
        opening_discipline: openingDiscipline,
      });
    },
    recordPlayerMatchScoreRack({ actorUserId, playerMatchId, scoringTeamId, winnerSide }) {
      return callRpc('record_player_match_score_rack', {
        ...scoringBody({ actorUserId, playerMatchId, scoringTeamId }),
        rack_winner_side: winnerSide,
      });
    },
    updatePlayerMatchScoreRack({ actorUserId, playerMatchId, scoringTeamId, rackNumber, winnerSide }) {
      return callRpc('update_player_match_score_rack', {
        ...scoringBody({ actorUserId, playerMatchId, scoringTeamId }),
        target_rack_number: rackNumber,
        rack_winner_side: winnerSide,
      });
    },
    undoPlayerMatchScoreRack(input) {
      return callRpc('undo_player_match_score_rack', scoringBody(input));
    },
    confirmPlayerMatchScore(input) {
      return callRpc('confirm_player_match_score', scoringBody(input));
    },
    finalizeReconciledPlayerMatch(input) {
      return callRpc('finalize_reconciled_player_match', scoringBody(input));
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