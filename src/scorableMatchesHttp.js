import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { conditionalJsonResponse } from './httpConditional.js';
import { createScorableMatchesRepository } from './scorableMatchesRepository.js';
import { mergeScorableMatches } from './druScoreOpen.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export function scorableMatchesStatusForError(error) {
  return rpcErrorStatus(error);
}

export function createScorableMatchesHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createScorableMatchesRepository,
} = {}) {
  return {
    async list(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const matches = await repository.listScorableMatches({ actorUserId: actor.id });
        const opened = String(env?.ENVIRONMENT || '').trim() === 'dru'
          ? await listOpenedDruMatches(env, fetchImpl)
          : [];
        return conditionalJsonResponse(request, { matches: mergeScorableMatches(matches, opened) }, { cacheControl: 'private, no-store' });
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, scorableMatchesStatusForError(error));
      }
    },
  };
}

export const scorableMatchesHttpHandlers = createScorableMatchesHttpHandlers();

async function listOpenedDruMatches(env, fetchImpl) {
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return [];
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' };
  const response = await fetchImpl(`${base}/rest/v1/player_matches?status=eq.scheduled&select=id,team_match_id,slot_number,status&limit=60`, { headers });
  if (!response.ok) return [];
  const races = await response.json();
  return (Array.isArray(races) ? races : []).map((race) => ({
    player_match_id: race.id,
    team_match_id: race.team_match_id,
    slot_number: race.slot_number,
    status: race.status,
    team_a_name: 'Home',
    team_b_name: 'Away',
    scoring_team_name: 'Home',
    player_a_name: 'Home',
    player_b_name: 'Away',
    round_number: 1,
  }));
}
