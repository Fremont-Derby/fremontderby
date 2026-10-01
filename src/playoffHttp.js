import { readSanitizedJsonBody, safeClientErrorMessage } from './requestSanitize.js';
import {
  advanceSeasonToChampionshipCommand,
  startSeasonPlayoffsCommand,
  submitPostseasonLineupCommand,
} from './playoffCommands.js';
import { createPlayoffRepository } from './playoffRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function readJsonBody(request) {
  return readSanitizedJsonBody(request);
}

export function playoffStatusForError(error) {
  return rpcErrorStatus(error);
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
        return jsonResponse({ error: safeClientErrorMessage(error) }, playoffStatusForError(error));
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
        return jsonResponse({ error: safeClientErrorMessage(error) }, playoffStatusForError(error));
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
        return jsonResponse({ error: safeClientErrorMessage(error) }, playoffStatusForError(error));
      }
    },
  };
}

export const playoffHttpHandlers = createPlayoffHttpHandlers();
