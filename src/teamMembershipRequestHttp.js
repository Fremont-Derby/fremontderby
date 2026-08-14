import { readSanitizedJsonBody, safeClientErrorMessage } from './requestSanitize.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';
import { createTeamMembershipRequestRepository } from './teamMembershipRequestRepository.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function readJsonBody(request) {
  return readSanitizedJsonBody(request);
}

export function teamMembershipStatusForError(error) {
  const message = error?.message || 'Request failed';
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  if (message.includes('Only the active captain')) return 403;
  if (message.includes('Only the requesting player')) return 403;
  if (message.includes('not found')) return 404;
  if (message.includes('already pending')) return 409;
  if (message.includes('already has an active team membership')) return 409;
  if (message.includes('no longer pending')) return 409;
  return 400;
}

export function createTeamMembershipRequestHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createTeamMembershipRequestRepository,
} = {}) {
  return {
    async list(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const requests = await repository.listOwn({ actorUserId: actor.id });
        return jsonResponse({ requests: requests ?? { player_requests: [], captain_requests: [] } });
      } catch (error) {
        return jsonResponse({ error: error.message }, teamMembershipStatusForError(error));
      }
    },

    async requestJoin(request, env, teamId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const membershipRequest = await repository.requestJoin({
          actorUserId: actor.id,
          teamId,
        });
        return jsonResponse({ membershipRequest }, 201);
      } catch (error) {
        return jsonResponse({ error: error.message }, teamMembershipStatusForError(error));
      }
    },

    async respond(request, env, requestId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const body = await readJsonBody(request);
        const response = body.response;
        if (!['approved', 'declined'].includes(response)) {
          throw new Error('response must be approved or declined');
        }
        const repository = createRepository(env, { fetch: fetchImpl });
        const membershipRequest = await repository.respond({
          actorUserId: actor.id,
          requestId,
          response,
        });
        return jsonResponse({ membershipRequest });
      } catch (error) {
        return jsonResponse({ error: error.message }, teamMembershipStatusForError(error));
      }
    },

    async cancel(request, env, requestId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      try {
        const actor = await authenticate(request, env, { fetch: fetchImpl });
        const repository = createRepository(env, { fetch: fetchImpl });
        const membershipRequest = await repository.cancel({
          actorUserId: actor.id,
          requestId,
        });
        return jsonResponse({ membershipRequest });
      } catch (error) {
        return jsonResponse({ error: error.message }, teamMembershipStatusForError(error));
      }
    },
  };
}

export const teamMembershipRequestHttpHandlers = createTeamMembershipRequestHttpHandlers();
