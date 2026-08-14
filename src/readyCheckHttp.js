import { jsonNoStore } from './httpJson.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import {
  listMyPendingReadyChecksCommand,
  respondTeamReadyCheckCommand,
  startTeamReadyCheckCommand,
} from './readyCheckCommands.js';
import { createReadyCheckRepository } from './readyCheckRepository.js';

const json = jsonNoStore;

export function readyCheckErrorStatus(error) {
  if (error instanceof AuthError) return error.status;
  if (/membership is required|Player profile is required|closed|not found/i.test(error.message)) {
    return 409;
  }
  if (String(error.message || '').startsWith('Supabase request failed with 401')) return 401;
  if (String(error.message || '').startsWith('Supabase request failed with 403')) return 403;
  return 400;
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
        return json({ error: error.message }, readyCheckErrorStatus(error));
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
            teamId: body.teamId,
            roundId: body.roundId,
          },
          repository,
        );
        return json({ readyCheck }, 201);
      } catch (error) {
        return json({ error: error.message }, readyCheckErrorStatus(error));
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
            response: body.response ?? body.status,
          },
          repository,
        );
        return json({ response });
      } catch (error) {
        return json({ error: error.message }, readyCheckErrorStatus(error));
      }
    },
  };
}

export const readyCheckHttpHandlers = createReadyCheckHttpHandlers();
