import { AuthError, authenticateSupabaseUser } from './supabaseAuth.js';
import { withSupabaseSchema } from './supabaseSchema.js';

export async function routeSocialChatConsent(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const match = new URL(request.url).pathname.match(/^\/api\/me\/social-chat-consent\/(general|team)$/);
  if (!match) return null;
  const respond = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
  if (env.ENVIRONMENT !== 'jfl') return respond({ error: 'Not found' }, 404);
  if (!['GET', 'PUT'].includes(request.method)) return respond({ error: 'Method not allowed' }, 405);
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    const body = { actor_user_id: actor.id, channel: match[1] };
    if (request.method === 'PUT') {
      let input;
      try { input = await request.json(); } catch { return respond({ error: 'Valid JSON is required' }, 400); }
      if (!input || typeof input !== 'object' || Array.isArray(input)
        || Object.keys(input).length !== 1 || typeof input.enabled !== 'boolean') {
        return respond({ error: 'enabled must be an explicit boolean' }, 400);
      }
      body.enabled = input.enabled;
    }
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key || !env.SUPABASE_URL) throw new Error('Unavailable');
    const name = request.method === 'GET' ? 'get_social_chat_consent' : 'set_social_chat_consent';
    const response = await withSupabaseSchema(fetchImpl, env)(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/${name}`, {
      method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Unavailable');
    const enabled = await response.json();
    if (typeof enabled !== 'boolean') throw new Error('Unavailable');
    return respond({ channel: match[1], enabled });
  } catch (error) {
    return respond({ error: error instanceof AuthError ? error.message : 'Messaging settings unavailable' },
      error instanceof AuthError ? error.status : 503);
  }
}

