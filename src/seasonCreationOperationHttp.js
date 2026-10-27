import { authenticateSupabaseUser } from './supabaseAuth.js';
import { createSupabaseSeasonRepository } from './supabaseSeasonRepository.js';
import { rpcErrorStatus } from './rpcErrorStatus.js';
import { safeClientErrorMessage } from './requestSanitize.js';

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
    const response = reply({ error: safeClientErrorMessage(error) }, error.status || rpcErrorStatus(error));
    if (error.status === 429 && error.retryAfter) response.headers.set('retry-after', error.retryAfter);
    return response;
  }
}
