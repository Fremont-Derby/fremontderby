import { createPlayerClaimRepository } from './playerClaimRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

export function playerClaimErrorMessage(error) {
  const message = String(error?.message || error || '');
  if (/already claimed/i.test(message)) {
    return 'Already claimed — this player is already linked to an account.';
  }
  if (/game history/i.test(message)) {
    return 'Has game history — this player has recorded competitive racks and cannot be self-claimed. Contact the league admin.';
  }
  if (/already have a player profile/i.test(message)) {
    return 'You already have a player profile.';
  }
  if (/Player not found/i.test(message)) return 'Player not found.';
  if (/required/i.test(message)) return 'Choose a player to claim.';
  return 'We could not complete that claim. Nothing was changed. Please try again.';
}

export function playerClaimStatusFor(error) {
  if (error instanceof AuthError) return error.status;
  if (/already claimed|game history|already have a player profile/i.test(error.message)) return 409;
  if (/not found/i.test(error.message)) return 404;
  if (/required/i.test(error.message)) return 400;
  return 502;
}

function noStore(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export async function routePlayerClaim(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  const url = new URL(request.url);
  const isOptions = url.pathname === '/api/me/player-claim-options';
  const isClaim = url.pathname === '/api/me/player-claim';
  if (!isOptions && !isClaim) return null;

  if ((isOptions && request.method !== 'GET') || (isClaim && request.method !== 'POST')) {
    return noStore({ error: 'Method not allowed' }, 405);
  }

  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createPlayerClaimRepository(env, { fetch: fetchImpl });

    if (isOptions) {
      const search = (url.searchParams.get('q') || '').trim().slice(0, 80);
      const options = await repository.getOptions({ actorUserId: actor.id, search });
      return noStore({ options });
    }

    const body = await request.json().catch(() => ({}));
    const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';
    if (!playerId) return noStore({ error: 'Choose a player to claim.' }, 400);
    const player = await repository.claim({ actorUserId: actor.id, playerId });
    return noStore({ player });
  } catch (error) {
    return noStore({ error: playerClaimErrorMessage(error) }, playerClaimStatusFor(error));
  }
}
