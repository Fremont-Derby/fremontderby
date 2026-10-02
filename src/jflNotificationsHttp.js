import { authenticateSupabaseUser, AuthError } from './supabaseAuth.js';
import { withSupabaseSchema } from './supabaseSchema.js';
import { renderJflNotificationsPage } from './jflNotificationsPage.js';

const readPath = /^\/api\/me\/notifications\/([^/]+)\/read$/;

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function errorStatus(error) {
  if (error instanceof AuthError) return error.status;
  if (error.status === 404) return 404;
  return 502;
}

export function createJflNotificationsRoute({ authenticate = authenticateSupabaseUser, fetchImpl = globalThis.fetch } = {}) {
  return async function routeJflNotifications(request, env) {
    if (env?.ENVIRONMENT !== 'jfl') return null;
    const pathname = new URL(request.url).pathname;
    if (pathname === '/notifications') {
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      return new Response(renderJflNotificationsPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
      });
    }

    const isList = pathname === '/api/me/notifications';
    const isAll = pathname === '/api/me/notifications/read-all';
    const read = pathname.match(readPath);
    if (!isList && !isAll && !read) return null;
    if ((isList && request.method !== 'GET') || (!isList && request.method !== 'POST')) {
      return json({ error: 'Method not allowed' }, 405);
    }
    try {
      const actor = await authenticate(request, env, { fetch: fetchImpl });
      const url = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
      const key = env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error('Notification store is not configured');
      const rpc = isList ? 'list_my_notifications' : isAll ? 'mark_all_my_notifications_read' : 'mark_my_notification_read';
      const payload = isList
        ? { actor_user_id: actor.id, result_limit: 50 }
        : isAll ? { actor_user_id: actor.id }
          : { actor_user_id: actor.id, target_notification_id: read[1] };
      const response = await withSupabaseSchema(fetchImpl, env)(`${url}/rest/v1/rpc/${rpc}`, {
        method: 'POST',
        headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        return json({ error: 'Notifications are unavailable. Please try again.' }, response.status === 404 ? 404 : 502);
      }
      const result = await response.json();
      if (isList) {
        const rows = Array.isArray(result) ? result : [];
        return json({ notifications: rows.map((row) => ({
          id: row.id, kind: row.kind, title: row.title, body: row.body,
          href: row.href, readAt: row.read_at, createdAt: row.created_at,
        })) });
      }
      if (isAll) return json({ updated: Number(result) || 0 });
      const row = Array.isArray(result) ? result[0] : result;
      return json({ notification: { id: row?.id ?? read[1], readAt: row?.read_at ?? null } });
    } catch (error) {
      const status = errorStatus(error);
      return json({ error: status === 401 ? error.message : 'Notifications are unavailable. Please try again.' }, status);
    }
  };
}

export const routeJflNotifications = createJflNotificationsRoute();
