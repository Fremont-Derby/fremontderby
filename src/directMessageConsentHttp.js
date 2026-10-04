import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { withSupabaseSchema } from './supabaseSchema.js';

export async function routeDirectMessageConsent(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (new URL(request.url).pathname !== '/api/me/direct-message-consent') return null;
  const respond = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
  if (env.ENVIRONMENT !== 'jfl') return respond({ error: 'Not found' }, 404);
  if (!['GET', 'PUT'].includes(request.method)) return respond({ error: 'Method not allowed' }, 405);
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = { actor_user_id: actor.id };
    if (request.method === 'PUT') {
      let input;
      try { input = await request.json(); } catch { return respond({ error: 'Valid JSON is required' }, 400); }
      if (!input || typeof input !== 'object' || Array.isArray(input)
        || Object.keys(input).length !== 1 || typeof input.directMessages !== 'boolean') {
        return respond({ error: 'directMessages must be an explicit boolean' }, 400);
      }
      body.enabled = input.directMessages;
    }
    const name = request.method === 'GET' ? 'get_direct_message_consent' : 'set_direct_message_consent';
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key || !env.SUPABASE_URL) throw new Error('Messaging settings unavailable');
    const response = await withSupabaseSchema(fetchImpl, env)(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/${name}`, {
      method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Messaging settings unavailable');
    const result = await response.json();
    if (typeof result !== 'boolean') throw new Error('Messaging settings unavailable');
    return respond({ directMessages: result });
  } catch (error) {
    return respond({ error: error instanceof AuthError ? error.message : 'Messaging settings unavailable' },
      error instanceof AuthError ? error.status : 503);
  }
}
