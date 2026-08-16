import { jsonNoStore } from './httpJson.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import {
  listMyPendingReadyChecksCommand,
  respondTeamReadyCheckCommand,
  startTeamReadyCheckCommand,
} from './readyCheckCommands.js';
import { createReadyCheckRepository } from './readyCheckRepository.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

const json = jsonNoStore;

export function readyCheckErrorStatus(error) {
  return rpcErrorStatus(error);
}

export function createReadyCheckHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createReadyCheckRepository,
} = {}) {
  return {
    async listPending(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const readyChecks = await listMyPendingReadyChecksCommand(
          { actorUserId: actor.id },
          repository,
        );
        return json({ readyChecks });
      } catch (error) {
        return json({ error: safeClientErrorMessage(error) }, readyCheckErrorStatus(error));
      }
    },

    async start(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const body = await request.json().catch(() => ({}));
        const repository = createRepository(env, { fetch: fetchImpl });
        const readyCheck = await startTeamReadyCheckCommand(
          {
            actorUserId: actor.id,
            teamId: body.teamId ?? body.team_id,
            roundId: body.roundId ?? body.round_id,
          },
          repository,
        );
        return json({ readyCheck }, 201);
      } catch (error) {
        return json({ error: safeClientErrorMessage(error) }, readyCheckErrorStatus(error));
      }
    },

    /** Team-scoped start: POST /api/teams/:teamId/ready-check[s] */
    async startForTeam(request, env, teamId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const body = await request.json().catch(() => ({}));
        const repository = createRepository(env, { fetch: fetchImpl });
        const readyCheck = await startTeamReadyCheckCommand(
          {
            actorUserId: actor.id,
            teamId: teamId || body.teamId || body.team_id,
            roundId: body.roundId ?? body.round_id,
          },
          repository,
        );
        return json({ readyCheck }, 201);
      } catch (error) {
        return json({ error: safeClientErrorMessage(error) }, readyCheckErrorStatus(error));
      }
    },

    async respond(request, env, readyCheckId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const body = await request.json().catch(() => ({}));
        const repository = createRepository(env, { fetch: fetchImpl });
        const response = await respondTeamReadyCheckCommand(
          {
            actorUserId: actor.id,
            readyCheckId,
            response: body.response ?? body.status ?? body.decision ?? body.action
              ?? (body.ready === true ? 'ready' : null)
              ?? (body.notReady === true || body.not_ready === true ? 'not_ready' : null),
          },
          repository,
        );
        return json({ response });
      } catch (error) {
        return json({ error: safeClientErrorMessage(error) }, readyCheckErrorStatus(error));
      }
    },
  };
}

export const readyCheckHttpHandlers = createReadyCheckHttpHandlers();
