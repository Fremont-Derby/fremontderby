const LIST_PATH = '/api/me/notifications';
const READ_ALL_PATHS = new Set([
  '/api/me/notifications/read-all',
  '/api/me/notifications/mark-all-read',
]);

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export async function routeJflMeNotifications(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || !request) return null;
  const url = new URL(request.url);
  const path = url.pathname;
  if (path !== LIST_PATH && !READ_ALL_PATHS.has(path)) return null;

  if (path === LIST_PATH) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ notifications: [] });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  return jsonResponse({ ok: true, notifications: [] });
}
