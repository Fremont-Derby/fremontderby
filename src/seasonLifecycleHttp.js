import { jsonNoStore } from './httpJson.js';
import {
  archiveSeasonCommand,
  cancelSeasonCommand,
  getSeasonLifecycleReadinessCommand,
  safeDeleteSeasonCommand,
} from './seasonLifecycleCommands.js';
import { createSeasonLifecycleRepository } from './seasonLifecycleRepository.js';
import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { readSanitizedJsonBody, safeClientErrorMessage } from './requestSanitize.js';

const json = jsonNoStore;

export function statusForError(error) {
  return rpcErrorStatus(error);
}

async function withActor(request, env, fetchImpl) {
  return authenticateSupabaseUser(request, env, { fetch: fetchImpl });
}

export async function routeSeasonLifecycle(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const url = new URL(request.url);
  const readiness = url.pathname.match(/^\/api\/admin\/seasons\/([^/]+)\/lifecycle-readiness$/);
  if (readiness) {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    try {
      const actor = await withActor(request, env, fetchImpl);
      const repository = createSeasonLifecycleRepository(env, { fetch: fetchImpl });
      const result = await getSeasonLifecycleReadinessCommand(
        { actorUserId: actor.id, seasonId: decodeURIComponent(readiness[1]) },
        repository,
      );
      return json({ readiness: result });
    } catch (error) {
      return json({ error: safeClientErrorMessage(error) }, statusForError(error));
    }
  }

  const cancel = url.pathname.match(/^\/api\/admin\/seasons\/([^/]+)\/cancel$/);
  if (cancel) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    try {
      const actor = await withActor(request, env, fetchImpl);
      const body = await readSanitizedJsonBody(request);
      const repository = createSeasonLifecycleRepository(env, { fetch: fetchImpl });
      const result = await cancelSeasonCommand(
        {
          actorUserId: actor.id,
          seasonId: decodeURIComponent(cancel[1]),
          reason: body?.reason ?? body?.cancelReason ?? '',
        },
        repository,
      );
      return json({ season: result });
    } catch (error) {
      return json({ error: safeClientErrorMessage(error) }, statusForError(error));
    }
  }

  const archive = url.pathname.match(/^\/api\/admin\/seasons\/([^/]+)\/archive$/);
  if (archive) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    try {
      const actor = await withActor(request, env, fetchImpl);
      const repository = createSeasonLifecycleRepository(env, { fetch: fetchImpl });
      const result = await archiveSeasonCommand(
        { actorUserId: actor.id, seasonId: decodeURIComponent(archive[1]) },
        repository,
      );
      return json({ season: result });
    } catch (error) {
      return json({ error: safeClientErrorMessage(error) }, statusForError(error));
    }
  }

  const del = url.pathname.match(/^\/api\/admin\/seasons\/([^/]+)\/safe-delete$/);
  if (del) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    try {
      const actor = await withActor(request, env, fetchImpl);
      const repository = createSeasonLifecycleRepository(env, { fetch: fetchImpl });
      const result = await safeDeleteSeasonCommand(
        { actorUserId: actor.id, seasonId: decodeURIComponent(del[1]) },
        repository,
      );
      return json({ season: result });
    } catch (error) {
      return json({ error: safeClientErrorMessage(error) }, statusForError(error));
    }
  }

  return null;
}
