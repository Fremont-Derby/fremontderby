import { authenticateSupabaseUser } from './supabaseAuth.js';
import { safeClientErrorMessage } from './requestSanitize.js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

/**
 * #361 Admin support queue API.
 * Authorization: same probe as other admin surfaces (operations overview / admin list).
 * Queue payload starts empty until message-bridge fills items; structure is stable.
 */
export async function routeAdminSupport(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/admin/support') return null;
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  try {
    const actor = await authenticateSupabaseUser(request, env, { fetch: fetchImpl });
    // Reuse operations authorization boundary — non-admins get 403 from the RPC/list path.
    const ops = await fetchImpl(
      `${String(env.SUPABASE_URL || '').replace(/\/$/, '')}/rest/v1/rpc/list_admin_operations_overview`,
      {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ actor_user_id: actor.id }),
      },
    ).catch(() => null);
    // Fallback: admin players list probe
    if (!ops || !ops.ok) {
      const probe = await fetchImpl(
        `${String(env.SUPABASE_URL || '').replace(/\/$/, '')}/rest/v1/rpc/list_admin_players_for_management`,
        {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ actor_user_id: actor.id }),
        },
      );
      if (!probe.ok) {
        const text = await probe.text();
        if (/not a league admin|not authorized|forbidden/i.test(text)) {
          return json({ error: 'League admin access required' }, 403);
        }
        return json({ error: 'Could not authorize admin support' }, 403);
      }
    }
    return json({
      items: [],
      state: url.searchParams.get('state') || 'open',
      note: 'Queue structure ready; connect league help messages when the bridge ships.',
    });
  } catch (error) {
    const message = safeClientErrorMessage(error);
    const status = /sign in|auth|jwt|token/i.test(String(error?.message || message)) ? 401 : 403;
    return json({ error: message }, status);
  }
}
