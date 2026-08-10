import { startSeasonPlayoffsCommand } from './playoffCommands.js';
import { createPlayoffRepository } from './playoffRepository.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function statusForError(error) {
  const message = error?.message || 'Request failed';
  if (message.includes('Actor is not a league admin')) return 403;
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  if (message.includes('Season not found')) return 404;
  if (
    message.includes('regular season')
    || message.includes('seven')
    || message.includes('already')
    || message.includes('playoff')
    || message.includes('complete')
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
  };
}

export const playoffHttpHandlers = createPlayoffHttpHandlers();
