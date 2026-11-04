import { readSanitizedJsonBody, requireUuid } from './requestSanitize.js';
import { authenticateSupabaseUser } from './supabaseAuth.js';
import { createDualScoringRepository } from './dualScoringRepository.js';

const methods = Object.freeze({
  read: 'getPlayerMatchScoreClaim',
  claim: 'claimPlayerMatchScore',
  request: 'requestPlayerMatchScoreTakeover',
  respond: 'respondPlayerMatchScoreTakeover',
  release: 'releasePlayerMatchScoreClaim',
});

function statusForError(error) {
  if ([400, 401, 403, 413, 415].includes(error?.status)) return error.status;
  const message = error?.message || '';
  if (/not an active member|not part|Only the current scorekeeper|ineligible|active on both teams/i.test(message)) return 403;
  if (/Player match not found/.test(message)) return 404;
  if (/already pending|No scorekeeping takeover request|already claimed|finalized/i.test(message)) return 409;
  return 500;
}

export function createScoreClaimHttpHandler({
  authenticate = authenticateSupabaseUser,
  createRepository = createDualScoringRepository,
} = {}) {
  return async function scoreClaim(request, env, playerMatchId, action, { fetch: fetchImpl = globalThis.fetch } = {}) {
    const headers = { 'cache-control': 'no-store' };
    if (env?.ENVIRONMENT !== 'jfl') return Response.json({ error: 'Not found' }, { status: 404, headers });
    const method = Object.hasOwn(methods, action) ? methods[action] : null;
    if (!method) return Response.json({ error: 'Not found' }, { status: 404, headers });
    const allowed = action === 'read' ? 'GET' : 'POST';
    if (request.method !== allowed) {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { ...headers, allow: allowed } });
    }
    try {
      const actor = await authenticate(request, env, { fetch: fetchImpl });
      if (!actor?.id) return Response.json({ error: 'Authentication required' }, { status: 401, headers });
      playerMatchId = requireUuid(playerMatchId, 'player match id');
      const body = allowed === 'POST' ? await readSanitizedJsonBody(request) : {};
      const scoringTeamId = requireUuid(allowed === 'GET'
        ? new URL(request.url).searchParams.get('scoringTeamId') : body.scoringTeamId,
      'scoring team id');
      if (action === 'respond' && !['release', 'deny'].includes(body.decision)) {
        return Response.json({ error: 'decision must be release or deny' }, { status: 400, headers });
      }
      const repository = createRepository(env, { fetch: fetchImpl });
      const claim = await repository[method]({
        actorUserId: actor.id, playerMatchId, scoringTeamId,
        ...(action === 'respond' ? { decision: body.decision } : {}),
      });
      return Response.json({ claim }, { headers });
    } catch (error) {
      const status = statusForError(error);
      return Response.json({ error: status === 500 ? 'Scorekeeping request failed' : error.message }, { status, headers });
    }
  };
}

export const scoreClaimHttpHandler = createScoreClaimHttpHandler();
