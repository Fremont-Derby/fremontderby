import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { conditionalJsonResponse } from './httpConditional.js';
import { createScorableMatchesRepository } from './scorableMatchesRepository.js';
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
        return conditionalJsonResponse(request, { matches }, { cacheControl: 'private, no-store' });
      } catch (error) {
        return jsonResponse({ error: safeClientErrorMessage(error) }, scorableMatchesStatusForError(error));
      }
    },
  };
}

export const scorableMatchesHttpHandlers = createScorableMatchesHttpHandlers();
