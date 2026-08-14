import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { createScorableMatchesRepository } from './scorableMatchesRepository.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export function scorableMatchesStatusForError(error) {
  if (error instanceof AuthError) return error.status;
  const message = error?.message || 'Request failed';
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  return 400;
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
        return jsonResponse({ matches });
      } catch (error) {
        return jsonResponse({ error: error.message }, scorableMatchesStatusForError(error));
      }
    },
  };
}

export const scorableMatchesHttpHandlers = createScorableMatchesHttpHandlers();
