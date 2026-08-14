import {
  adminOverrideReconciledPlayerMatchCommand,
  confirmPlayerMatchScoreCommand,
  finalizeReconciledPlayerMatchCommand,
  getPlayerMatchScoreComparisonCommand,
  recordPlayerMatchScoreRackCommand,
  setPlayerMatchOpeningDisciplineCommand,
  undoPlayerMatchScoreRackCommand,
  updatePlayerMatchScoreRackCommand,
} from './dualScoringCommands.js';
import { createDualScoringRepository } from './dualScoringRepository.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';

function jsonResponse(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers });
}

export function dualScoringStatusForError(error) {
  const message = error?.message || 'Request failed';
  if (message.includes('Actor is not a league admin')) return 403;
  if (message.includes('not an active member of the scoring team')) return 403;
  if (message.includes('Scoring team is not part')) return 403;
  if (message.includes('Supabase request failed with 401')) return 401;
  if (message.includes('Supabase request failed with 403')) return 403;
  if (message.includes('Player match not found')) return 404;
  if (
    message.includes('finalized')
    || message.includes('must match')
    || message.includes('Both teams must confirm')
    || message.includes('Both team score records are required')
    || message.includes('Race target')
    || message.includes('Score record')
    || message.includes('Resolved rack history')
    || message.includes('Opening discipline is locked')
    || message.includes('Rack is not present')
    || message.includes('Score changed on another device')
    || message.includes('Refresh the scorecard before changing the score')
  ) return 409;
  return 400;
}

async function readJsonBody(request) {
  const text = await request.text();
  if (!text.trim()) return {};
  const body = JSON.parse(text);
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error('Request body must be a JSON object');
  return body;
}

function scoringTeamFromRequest(request, body = {}) {
  const url = new URL(request.url);
  return body.scoringTeamId ?? body.scoring_team_id ?? url.searchParams.get('scoringTeamId') ?? url.searchParams.get('team');
}

function scoreSnapshotCookieName(playerMatchId, scoringTeamId) {
  const safeMatch = String(playerMatchId || '').replace(/[^A-Za-z0-9_-]/g, '');
  const safeTeam = String(scoringTeamId || '').replace(/[^A-Za-z0-9_-]/g, '');
  return `fd_score_${safeMatch}_${safeTeam}`;
}

function cookieValues(request) {
  const header = request.headers.get('cookie') || '';
  return new Map(header.split(';').map((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [part.trim(), ''];
    return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  }).filter(([name]) => name));
}

function encodeScoreSnapshot(racks) {
  return encodeURIComponent(JSON.stringify(Array.isArray(racks) ? racks : []));
}

function decodeScoreSnapshot(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function expectedRacksFromRequest(request, body, playerMatchId, scoringTeamId) {
  const explicit = body.expectedRacks ?? body.expected_racks;
  if (Array.isArray(explicit)) return explicit;
  const cookieName = scoreSnapshotCookieName(playerMatchId, scoringTeamId);
  const snapshot = decodeScoreSnapshot(cookieValues(request).get(cookieName));
  if (snapshot) return snapshot;
  throw new Error('Refresh the scorecard before changing the score');
}

function scoreSnapshotCookie(playerMatchId, scoringTeamId, racks) {
  const name = scoreSnapshotCookieName(playerMatchId, scoringTeamId);
  const value = encodeScoreSnapshot(racks);
  return `${name}=${value}; Path=/api/player-matches/${playerMatchId}; Max-Age=21600; HttpOnly; Secure; SameSite=Lax`;
}

async function optionalLiveContext(repository, input) {
  if (typeof repository.getPlayerMatchLiveContext !== 'function') return null;
  try {
    return await repository.getPlayerMatchLiveContext(input);
  } catch (error) {
    if (error?.message?.includes('Supabase request failed with 404')) return null;
    throw error;
  }
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
      return jsonResponse({ error: error.message }, dualScoringStatusForError(error));
    }
  }

  return {
    compare(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const input = {
          actorUserId: actor.id,
          playerMatchId,
          scoringTeamId: scoringTeamFromRequest(request),
        };
        const [comparison, context] = await Promise.all([
          getPlayerMatchScoreComparisonCommand(input, repository),
          optionalLiveContext(repository, {
            actorUserId: actor.id,
            playerMatchId,
          }),
        ]);
        const headers = {
          'set-cookie': scoreSnapshotCookie(
            playerMatchId,
            input.scoringTeamId,
            comparison.own_racks || [],
          ),
        };
        return jsonResponse(context ? { comparison, context } : { comparison }, 200, headers);
      });
    },

    setOpeningDiscipline(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJsonBody(request);
        const setup = await setPlayerMatchOpeningDisciplineCommand({
          actorUserId: actor.id,
          playerMatchId,
          scoringTeamId: scoringTeamFromRequest(request, body),
          openingDiscipline: body.openingDiscipline ?? body.opening_discipline,
        }, repository);
        return jsonResponse({ setup });
      });
    },

    record(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJsonBody(request);
        const scoringTeamId = scoringTeamFromRequest(request, body);
        const openingDiscipline = body.openingDiscipline ?? body.opening_discipline;
        if (openingDiscipline) {
          const setup = await setPlayerMatchOpeningDisciplineCommand({
            actorUserId: actor.id,
            playerMatchId,
            scoringTeamId,
            openingDiscipline,
          }, repository);
          return jsonResponse({ setup });
        }
        const expectedRacks = expectedRacksFromRequest(
          request,
          body,
          playerMatchId,
          scoringTeamId,
        );
        const rackNumber = body.rackNumber ?? body.rack_number;
        if (rackNumber != null) {
          const rack = await updatePlayerMatchScoreRackCommand({
            actorUserId: actor.id,
            playerMatchId,
            scoringTeamId,
            rackNumber,
            winnerSide: body.winnerSide ?? body.winner,
            expectedRacks,
          }, repository);
          return jsonResponse({ rack });
        }
        const rack = await recordPlayerMatchScoreRackCommand({
          actorUserId: actor.id,
          playerMatchId,
          scoringTeamId,
          winnerSide: body.winnerSide ?? body.winner,
          expectedRacks,
        }, repository);
        return jsonResponse({ rack }, 201);
      });
    },

    undo(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJsonBody(request);
        const scoringTeamId = scoringTeamFromRequest(request, body);
        const undo = await undoPlayerMatchScoreRackCommand({
          actorUserId: actor.id,
          playerMatchId,
          scoringTeamId,
          expectedRacks: expectedRacksFromRequest(request, body, playerMatchId, scoringTeamId),
        }, repository);
        return jsonResponse({ undo });
      });
    },

    confirm(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJsonBody(request);
        const scoringTeamId = scoringTeamFromRequest(request, body);
        const confirmation = await confirmPlayerMatchScoreCommand({
          actorUserId: actor.id,
          playerMatchId,
          scoringTeamId,
          expectedRacks: expectedRacksFromRequest(request, body, playerMatchId, scoringTeamId),
        }, repository);
        return jsonResponse({ confirmation });
      });
    },

    finalize(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const match = await finalizeReconciledPlayerMatchCommand({
          actorUserId: actor.id,
          playerMatchId,
          scoringTeamId: scoringTeamFromRequest(request),
        }, repository);
        return jsonResponse({ match });
      });
    },

    adminOverride(request, env, playerMatchId, { fetch: fetchImpl = globalThis.fetch } = {}) {
      return withActor(request, env, fetchImpl, async (actor, repository) => {
        const body = await readJsonBody(request);
        const match = await adminOverrideReconciledPlayerMatchCommand({
          actorUserId: actor.id,
          playerMatchId,
          reason: body.reason,
          resolvedRacks: body.resolvedRacks ?? body.resolved_racks,
        }, repository);
        return jsonResponse({ match });
      });
    },
  };
}

export const dualScoringHttpHandlers = createDualScoringHttpHandlers();
