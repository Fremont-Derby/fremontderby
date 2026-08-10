import {
  adminOverrideReconciledPlayerMatchCommand,
  confirmPlayerMatchScoreCommand,
  finalizeReconciledPlayerMatchCommand,
  getPlayerMatchScoreComparisonCommand,
  recordPlayerMatchScoreRackCommand,
  undoPlayerMatchScoreRackCommand,
} from './dualScoringCommands.js';
import { createDualScoringRepository } from './dualScoringRepository.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';

function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

function statusForError(error) {
  const message = error?.message || 'Request failed';
  if (message.includes('Actor is not a league admin')) return 403;
  if (message.includes('Only match players')) return 403;
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  if (message.includes('Player match not found')) return 404;
  if (
    message.includes('finalized')
    || message.includes('must match')
    || message.includes('Both players must confirm')
    || message.includes('Both player score records are required')
    || message.includes('Race target')
    || message.includes('Score record')
    || message.includes('Resolved rack history')
  ) return 409;
  return 400;
}

async function readJsonBody(request) {
  const text = await request.text();
  if (!text.trim()) return {};
  const body = JSON.parse(text);
  if (!body || Array.isArray(body) || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object');
  }
  return body;
}

export function createDualScoringHttpHandlers({
  authenticate = authenticateSupabaseUser,
  createRepository = createDualScoringRepository,
} = {}) {
  async function withActor(request, env, fetchImpl, action) {
    try {
      const actor = await authenticate(request, env, { fetch: fetchImpl });
      const repository = createRepository(env, { fetch: fetchImpl });
      return await action(actor, repository);
    } catch (error) {
      return jsonResponse({ error: error.message }, statusForError(error));
    }
  }

  return {
    compare(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const comparison = await getPlayerMatchScoreComparisonCommand(
          { actorUserId: actor.id, playerMatchId },
          repository,
        );
        return jsonResponse({ comparison });
      });
    },

    record(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJsonBody(request);
        const rack = await recordPlayerMatchScoreRackCommand(
          {
            actorUserId: actor.id,
            playerMatchId,
            winnerSide: body.winnerSide ?? body.winner,
          },
          repository,
        );
        return jsonResponse({ rack }, 201);
      });
    },

    undo(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const undo = await undoPlayerMatchScoreRackCommand(
          { actorUserId: actor.id, playerMatchId },
          repository,
        );
        return jsonResponse({ undo });
      });
    },

    confirm(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const confirmation = await confirmPlayerMatchScoreCommand(
          { actorUserId: actor.id, playerMatchId },
          repository,
        );
        return jsonResponse({ confirmation });
      });
    },

    finalize(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const match = await finalizeReconciledPlayerMatchCommand(
          { actorUserId: actor.id, playerMatchId },
          repository,
        );
        return jsonResponse({ match });
      });
    },

    adminOverride(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJsonBody(request);
        const match = await adminOverrideReconciledPlayerMatchCommand(
          {
            actorUserId: actor.id,
            playerMatchId,
            reason: body.reason,
            resolvedRacks: body.resolvedRacks ?? body.resolved_racks,
          },
          repository,
        );
        return jsonResponse({ match });
      });
    },
  };
}

export const dualScoringHttpHandlers = createDualScoringHttpHandlers();
