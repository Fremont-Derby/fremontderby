import { createAdminPlayersRepository } from './adminPlayersRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

export function adminPlayersStatusForError(error) {
  const status = rpcErrorStatus(error);
  if (status !== 400) return status;
  const message = String(error?.message || '');
  if (/reason required|invalid/i.test(message)) return 400;
  return 502;
}

function errorResponse(error) {
  return Response.json(
    { error: safeClientErrorMessage(error) },
    { status: adminPlayersStatusForError(error), headers: { 'cache-control': 'no-store' } },
  );
}

export async function handleListAdminPlayersRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createAdminPlayersRepository(env, { fetch: fetchImpl });
    const [players, rosterTeams] = await Promise.all([
      repository.listPlayers({ actorUserId: actor.id }),
      repository.listRosterTeams({ actorUserId: actor.id }),
    ]);
    return Response.json(
      { players, rosterTeams },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleSetAdminRoleRequest(
  request,
  env,
  playerId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await request.json().catch(() => ({}));
    const repository = createAdminPlayersRepository(env, { fetch: fetchImpl });

    if (body.operation === 'competition-eligibility') {
      if (typeof body.eligible !== 'boolean') {
        return Response.json({ error: 'eligible is required' }, { status: 400 });
      }
      if (typeof body.seasonId !== 'string' || !body.seasonId.trim()) {
        return Response.json({ error: 'seasonId is required' }, { status: 400 });
      }
      const reason = typeof body.reason === 'string' ? body.reason.trim() || null : null;
      if (!body.eligible && !reason) {
        return Response.json(
          { error: 'A reason is required to mark a player ineligible' },
          { status: 400 },
        );
      }
      const result = await repository.setCompetitionEligibility({
        actorUserId: actor.id,
        playerId,
        seasonId: body.seasonId,
        eligible: body.eligible,
        reason,
      });
      return Response.json(
        { player: result },
        { headers: { 'cache-control': 'no-store' } },
      );
    }

    if (body.operation === 'roster-membership') {
      if (typeof body.active !== 'boolean') {
        return Response.json({ error: 'active is required' }, { status: 400 });
      }
      if (typeof body.seasonId !== 'string' || !body.seasonId.trim()) {
        return Response.json({ error: 'seasonId is required' }, { status: 400 });
      }
      if (typeof body.teamId !== 'string' || !body.teamId.trim()) {
        return Response.json({ error: 'teamId is required' }, { status: 400 });
      }
      const result = await repository.setRosterMembership({
        actorUserId: actor.id,
        playerId,
        seasonId: body.seasonId,
        teamId: body.teamId,
        active: body.active,
        reason: typeof body.reason === 'string' ? body.reason.trim() || null : null,
      });
      return Response.json(
        { membership: result },
        { headers: { 'cache-control': 'no-store' } },
      );
    }

    if (typeof body.enabled !== 'boolean') {
      return Response.json({ error: 'enabled is required' }, { status: 400 });
    }
    const result = await repository.setAdminRole({
      actorUserId: actor.id,
      playerId,
      enabled: body.enabled,
      reason: typeof body.reason === 'string' ? body.reason.trim() || null : null,
    });
    return Response.json(
      { player: result },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}



export async function handleRecomputeDerbyEstimateRequest(
  request,
  env,
  playerId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createAdminPlayersRepository(env, { fetch: fetchImpl });
    const observation = await repository.recomputeDerbyEstimate({
      actorUserId: actor.id,
      playerId,
    });
    return Response.json({ observation }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleRecordRatingObservationRequest(
  request,
  env,
  playerId,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await request.json().catch(() => ({}));
    const ratingValue = body.ratingValue ?? body.rating ?? body.fargo_rating;
    if (ratingValue == null || Number.isNaN(Number(ratingValue))) {
      return Response.json({ error: 'ratingValue is required (0–1000)' }, { status: 400, headers: { 'cache-control': 'no-store' } });
    }
    const sourceKind = body.sourceKind || body.source || 'admin_provisional';
    const allowed = new Set(['official_fargo', 'derby_estimate', 'admin_provisional', 'fremont_open_import', 'other']);
    if (!allowed.has(sourceKind)) {
      return Response.json({ error: 'Invalid sourceKind' }, { status: 400, headers: { 'cache-control': 'no-store' } });
    }
    const repository = createAdminPlayersRepository(env, { fetch: fetchImpl });
    const observation = await repository.recordRatingObservation({
      actorUserId: actor.id,
      playerId,
      sourceKind,
      ratingValue: Number(ratingValue),
      robustness: body.robustness ?? null,
      confidence: body.confidence ?? null,
      note: body.note || body.reason || null,
    });
    return Response.json({ observation }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

export const adminPlayersHttpHandlers = {
  recordRatingObservation: handleRecordRatingObservationRequest,
  list: handleListAdminPlayersRequest,
  setAdminRole: handleSetAdminRoleRequest,
};
