import {
  closeSeasonCommand,
  getSeasonCloseReadinessCommand,
} from './seasonCloseCommands.js';
import { createSeasonCloseRepository } from './seasonCloseRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function statusForError(error) {
  if (error instanceof AuthError) return error.status;
  if (error.message === 'Season not found') return 404;
  if (error.message.includes('Actor is not a league admin')) return 403;
  if (error.message.startsWith('Supabase request failed with 401')) return 401;
  if (error.message.startsWith('Supabase request failed with 403')) return 403;
  if (error.message.includes('before closing') || error.message.includes('still need')) return 409;
  return 400;
}

async function handle(request, env, seasonId, action, { fetch: fetchImpl = globalThis.fetch } = {}) {
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const repository = createSeasonCloseRepository(env, { fetch: fetchImpl });
    const payload = { actorUserId: actor.id, seasonId };
    const result = action === 'close'
      ? await closeSeasonCommand(payload, repository)
      : await getSeasonCloseReadinessCommand(payload, repository);
    return json(action === 'close' ? { season: result } : { readiness: result });
  } catch (error) {
    return json({ error: error.message }, statusForError(error));
  }
}

export async function routeSeasonClose(request, env) {
  const url = new URL(request.url);
  const readiness = url.pathname.match(/^\/api\/admin\/seasons\/([^/]+)\/close-readiness$/);
  if (readiness) {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    return handle(request, env, decodeURIComponent(readiness[1]), 'readiness');
  }

  const close = url.pathname.match(/^\/api\/admin\/seasons\/([^/]+)\/close$/);
  if (close) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    return handle(request, env, decodeURIComponent(close[1]), 'close');
  }

  return null;
}
