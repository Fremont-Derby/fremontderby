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
  const { withSupabaseSchema } = await import('./supabaseSchema.js');
  const fetchWithSchema = withSupabaseSchema(fetchImpl, env);
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return [];
  const headers = { apikey: key, authorization: `Bearer ${key}`, accept: 'application/json' };
  const response = await fetchWithSchema(`${base}/rest/v1/player_matches?status=eq.scheduled&select=id,team_match_id,slot_number,status,season_id,team_a_id,team_b_id,player_a_id,player_b_id&limit=60`, { headers });
  if (!response.ok) return [];
  const races = await response.json();
  if (!Array.isArray(races) || !races.length) return [];
  const matchIds = [...new Set(races.map((race) => race.team_match_id).filter(Boolean))].join(',');
  const matchesResponse = await fetchWithSchema(`${base}/rest/v1/team_matches?id=in.(${matchIds})&select=id,round_id`, { headers });
  const matches = matchesResponse.ok ? await matchesResponse.json() : [];
  const roundIds = [...new Set(matches.map((match) => match.round_id).filter(Boolean))].join(',');
  const roundsResponse = roundIds ? await fetchWithSchema(`${base}/rest/v1/rounds?id=in.(${roundIds})&select=id,round_number,scheduled_on`, { headers }) : null;
  const rounds = roundsResponse && roundsResponse.ok ? await roundsResponse.json() : [];
  const roundByMatch = new Map(matches.map((match) => [match.id, rounds.find((round) => round.id === match.round_id) || {}]));
  return races.map((race) => {
    const round = roundByMatch.get(race.team_match_id) || {};
    return {
      player_match_id: race.id,
      team_match_id: race.team_match_id,
      slot_number: race.slot_number,
      status: race.status,
      scoring_team_id: race.team_a_id,
      team_a_name: 'Home',
      team_b_name: 'Away',
      scoring_team_name: 'Home',
      player_a_name: 'Home',
      player_b_name: 'Away',
      round_number: round.round_number || 1,
      scheduled_on: round.scheduled_on || null,
    };
  });
}
