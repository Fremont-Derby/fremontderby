import { createAdminPlayersRepository } from './adminPlayersRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

export function adminCreatePlayerStatusFor(error) {
  if (error instanceof AuthError) return error.status;
  if (/Actor is not a league admin/i.test(error.message)) return 403;
  if (/already exists/i.test(error.message)) return 409;
  if (/required|80 characters/i.test(error.message)) return 400;
  return 502;
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
      { error: error.message },
      { status: adminCreatePlayerStatusFor(error), headers: { 'cache-control': 'no-store' } },
    );
  }
}
