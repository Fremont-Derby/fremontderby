const LIST_PATH = '/api/me/notifications';
const READ_ALL_PATHS = new Set([
  '/api/me/notifications/read-all',
  '/api/me/notifications/mark-all-read',
]);
const INVITE_PATHS = new Set(['/api/me/invitations', '/api/me/team-invitations', '/api/me/invites', '/api/me/team-invites']);
const READY_CHECK_PATHS = new Set(['/api/me/ready-checks', '/api/me/ready-check']);
const LINEUP_PATHS = new Set(['/api/me/lineups', '/api/me/lineup']);
const DM_PATHS = new Set(['/api/me/dms', '/api/me/dm-inbox']);

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export function routeDruPublicEmptyReads(request, env = {}) {
  if (env?.ENVIRONMENT !== 'dru' || !request) return null;
  const path = new URL(request.url).pathname;

  if (path === '/api/me/matches') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ matches: [] });
  }

  if (DM_PATHS.has(path)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ conversations: [] });
  }

  if (INVITE_PATHS.has(path)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ invitations: [], playerId: null });
  }

  if (READY_CHECK_PATHS.has(path)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ readyChecks: [] });
  }

  if (LINEUP_PATHS.has(path)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ lineups: [] });
  }

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
