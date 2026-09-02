import { createAdminPlayersRepository } from './adminPlayersRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

export function adminCreatePlayerStatusFor(error) {
  return rpcErrorStatus(error, { fallback: 502 });
}

export async function handleCreateAdminPlayerRequest(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = await request.json().catch(() => ({}));
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    if (!displayName) {
      return Response.json({ error: 'Player name is required' }, { status: 400 });
    }
    const repository = createAdminPlayersRepository(env, { fetch: fetchImpl });
    const player = await repository.createPlayer({
      actorUserId: actor.id,
      displayName,
      allowExactDuplicate: body.allowExactDuplicate === true,
    });
    return Response.json(
      { player },
      { status: 201, headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      { error: safeClientErrorMessage(error) },
      { status: adminCreatePlayerStatusFor(error), headers: { 'cache-control': 'no-store' } },
    );
  }
}
