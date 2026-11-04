import { authenticateSupabaseUser } from './supabaseAuth.js';
import { createSupabaseSeasonRepository } from './supabaseSeasonRepository.js';

const operationPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

// Reads only. An absent result never authorizes replay of an unknown POST.
export async function routeSeasonCreationOperation(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const match = new URL(request.url).pathname.match(/^\/api\/admin\/season-creation-operations\/([^/]+)$/);
  if (!match) return null;
  const reply = (body, status = 200) => Response.json(body, {
    status, headers: { 'cache-control': 'no-store' },
  });
  if (env.ENVIRONMENT !== 'jfl') return reply({ error: 'Not found' }, 404);
  if (request.method !== 'GET') return reply({ error: 'Method not allowed' }, 405);
  if (!/^Bearer\s+\S+$/i.test(request.headers.get('authorization') || '')) {
    return reply({ error: 'Sign in to check season creation.' }, 401);
  }
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const operationId = match[1];
    if (!operationPattern.test(operationId) || operationId === '00000000-0000-0000-0000-000000000000') {
      return reply({ error: 'A valid creation operation is required' }, 400);
    }
    const repository = createSupabaseSeasonRepository(env, { fetch: fetchImpl });
    const result = await repository.readSeasonCreationOperation({ actorUserId: actor.id, operationId });
    if (result === null) return reply({ operationId, found: false });
    if (!result?.setup?.id || !result.requestedInput || typeof result.requestedInput !== 'object'
      || Array.isArray(result.requestedInput)) throw new Error('Season creation result was not confirmed');
    return reply({ operationId, found: true, setup: result.setup, requestedInput: result.requestedInput });
  } catch (error) {
    const status = error.name === 'AuthError' ? 401
      : [401, 403, 429].includes(error.status) ? error.status
        : error.rpcCode === '23514' ? 409
          : /not confirmed/.test(error.message) ? 502 : 503;
    const message = status === 401 ? 'Open Profile and sign in again.'
      : status === 403 ? 'Only the authorized league admin can check this creation.'
        : status === 409 ? 'This creation is no longer available.'
          : status === 429 ? 'Too many requests. Wait before checking creation again.'
            : 'Season creation could not be confirmed. Check creation again before continuing.';
    const response = reply({ error: message }, status);
    if (error.status === 429 && error.retryAfter) response.headers.set('retry-after', error.retryAfter);
    return response;
  }
}
