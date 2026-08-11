import {
  advanceSeasonToChampionshipCommand,
  startSeasonPlayoffsCommand,
  submitPostseasonLineupCommand,
} from './playoffCommands.js';
import { createPlayoffRepository } from './playoffRepository.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function readJsonBody(request) {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== 'object') {
      throw new Error('Request body must be a JSON object');
    }
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Request body must be valid JSON');
    throw error;
  }
}

function statusForError(error) {
  const message = error?.message || 'Request failed';
  if (message.includes('Actor is not a league admin')) return 403;
  if (message.includes('Only the active captain')) return 403;
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  if (message.includes('Season not found') || message.includes('Team matchup not found')) return 404;
  if (
    message.includes('regular season')
    || message.includes('seven')
    || message.includes('already')
    || message.includes('playoff')
    || message.includes('Postseason')
    || message.includes('complete')
    || message.includes('semifinal')
    || message.includes('championship')
    || message.includes('tied')
    || message.includes('locked')
    || message.includes('4+')
  ) return 409;
  return 400;
}

export function createPlayoffHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createPlayoffRepository,
} = {}) {
  return {
    async start(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const playoffs = await startSeasonPlayoffsCommand(
          { seasonId, actorUserId: actor.id },
          repository,
        );
        return jsonResponse({ playoffs }, 201);
      } catch (error) {
        return jsonResponse({ error: error.message }, statusForError(error));
      }
    },

    async advance(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const championship = await advanceSeasonToChampionshipCommand(
          { seasonId, actorUserId: actor.id },
          repository,
        );
        return jsonResponse({ championship }, 201);
      } catch (error) {
        return jsonResponse({ error: error.message }, statusForError(error));
      }
    },

    async submitLineup(request, env, teamMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const body = await readJsonBody(request);
        const repository = createRepository(env, { fetch: fetchImpl });
        const lineup = await submitPostseasonLineupCommand(
          {
            actorUserId: actor.id,
            teamMatchId,
            teamId: body.teamId ?? body.team_id,
            playerIds: body.playerIds ?? body.player_ids,
            anchorPlayerId: body.anchorPlayerId ?? body.anchor_player_id,
          },
          repository,
        );
        return jsonResponse({ lineup }, 201);
      } catch (error) {
        return jsonResponse({ error: error.message }, statusForError(error));
      }
    },
  };
}

export const playoffHttpHandlers = createPlayoffHttpHandlers();
