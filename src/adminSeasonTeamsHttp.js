import {
  addAdminSeasonTeamCommand,
  listAdminSeasonTeamsCommand,
} from './adminSeasonTeamsCommands.js';
import { createAdminSeasonTeamsRepository } from './adminSeasonTeamsRepository.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';

function statusFor(error) {
  const message = error?.message || 'Request failed';
  if (message.includes('Actor is not a league admin')) return 403;
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  if (message.includes('Season not found') || message.includes('Team not found')) return 404;
  if (message.includes('No team slots') || message.includes('before season publication')) return 409;
  return 400;
}

export function createAdminSeasonTeamsHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createAdminSeasonTeamsRepository,
} = {}) {
  async function withActor(request, env, fetchImpl, action) {
    try {
      const actor = await authenticate(request, env, { fetch: fetchImpl });
      const repository = createRepository(env, { fetch: fetchImpl });
      return await action(actor, repository);
    } catch (error) {
      return Response.json({ error: error.message }, { status: statusFor(error) });
    }
  }

  return {
    list(request, env, seasonId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const state = await listAdminSeasonTeamsCommand({
          actorUserId: actor.id,
          seasonId,
        }, repository);
        return Response.json(state);
      });
    },

    add(request, env, seasonId, teamId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const team = await addAdminSeasonTeamCommand({
          actorUserId: actor.id,
          seasonId,
          teamId,
        }, repository);
        return Response.json({ team }, { status: 201 });
      });
    },
  };
}

export const adminSeasonTeamsHttpHandlers = createAdminSeasonTeamsHttpHandlers();
