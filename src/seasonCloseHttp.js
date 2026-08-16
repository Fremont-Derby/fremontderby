import { jsonNoStore } from './httpJson.js';
import {
  closeSeasonCommand,
  getSeasonCloseReadinessCommand,
} from './seasonCloseCommands.js';
import { createSeasonCloseRepository } from './seasonCloseRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

const json = jsonNoStore;

export function statusForError(error) {
  return rpcErrorStatus(error);
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
    return json({ error: safeClientErrorMessage(error) }, statusForError(error));
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
