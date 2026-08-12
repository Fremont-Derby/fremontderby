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

  const expectedBody = (expectedRacks) => ({ expected_racks: expectedRacks });

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
    recordPlayerMatchScoreRack({ actorUserId, playerMatchId, scoringTeamId, winnerSide, expectedRacks }) {
      const checked = Array.isArray(expectedRacks);
      return callRpc(checked ? 'record_player_match_score_rack_checked' : 'record_player_match_score_rack', {
        ...scoringBody({ actorUserId, playerMatchId, scoringTeamId }),
        rack_winner_side: winnerSide,
        ...(checked ? expectedBody(expectedRacks) : {}),
      });
    },
    updatePlayerMatchScoreRack({ actorUserId, playerMatchId, scoringTeamId, rackNumber, winnerSide, expectedRacks }) {
      const checked = Array.isArray(expectedRacks);
      return callRpc(checked ? 'update_player_match_score_rack_checked' : 'update_player_match_score_rack', {
        ...scoringBody({ actorUserId, playerMatchId, scoringTeamId }),
        target_rack_number: rackNumber,
        rack_winner_side: winnerSide,
        ...(checked ? expectedBody(expectedRacks) : {}),
      });
    },
    undoPlayerMatchScoreRack(input) {
      const checked = Array.isArray(input.expectedRacks);
      return callRpc(checked ? 'undo_player_match_score_rack_checked' : 'undo_player_match_score_rack', {
        ...scoringBody(input),
        ...(checked ? expectedBody(input.expectedRacks) : {}),
      });
    },
    confirmPlayerMatchScore(input) {
      const checked = Array.isArray(input.expectedRacks);
      return callRpc(checked ? 'confirm_player_match_score_checked' : 'confirm_player_match_score', {
        ...scoringBody(input),
        ...(checked ? expectedBody(input.expectedRacks) : {}),
      });
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
