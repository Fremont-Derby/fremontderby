import { createAdminPlayersRepository } from './adminPlayersRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

function statusForError(error) {
  if (error instanceof AuthError) return error.status;
  if (/Actor is not a league admin/i.test(error.message)) return 403;
  if (/last league admin/i.test(error.message)) return 409;
  if (/Player not found/i.test(error.message)) return 404;
  if (/required|500 characters|must sign in/i.test(error.message)) return 400;
  return 502;
}

function errorResponse(error) {
  return Response.json(
    { error: error.message },
    { status: statusForError(error), headers: { 'cache-control': 'no-store' } },
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
    return Response.json(
      { players: await repository.listPlayers({ actorUserId: actor.id }) },
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
    if (typeof body.enabled !== 'boolean') {
      return Response.json({ error: 'enabled is required' }, { status: 400 });
    }
    const repository = createAdminPlayersRepository(env, { fetch: fetchImpl });
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

export const adminPlayersHttpHandlers = {
  list: handleListAdminPlayersRequest,
  setAdminRole: handleSetAdminRoleRequest,
};
