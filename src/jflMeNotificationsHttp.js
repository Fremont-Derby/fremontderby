const LIST_PATH = '/api/me/notifications';
const READ_ALL_PATHS = new Set([
  '/api/me/notifications/read-all',
  '/api/me/notifications/mark-all-read',
]);
const INVITE_PATHS = new Set(['/api/me/invitations', '/api/me/team-invitations']);
const PRIZE_PATHS = new Set(['/api/prizes', '/api/prize-pool']);
const READY_CHECK_PATHS = new Set(['/api/me/ready-checks', '/api/me/ready-check']);
const LINEUP_PATHS = new Set(['/api/me/lineups', '/api/me/lineup']);
const TRADE_PATHS = new Set(['/api/me/trades']);

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function emptyPrizeSummary() {
  return {
    summary: {
      season_id: null,
      season_name: null,
      season_status: null,
      player_count: 0,
      paid_amount_cents: 0,
      committed_amount_cents: 0,
      entry_fee_cents: 0,
      administration_amount_cents: 0,
      projected_field_size: 0,
      projected_gross_cents: 0,
      projected_prize_pool_cents: 0,
      team_allocation_basis_points: 0,
      individual_allocation_basis_points: 0,
      team_prize_pool_cents: 0,
      individual_prize_pool_cents: 0,
      configuration_version: null,
      configured_at: null,
      projected_payouts: [],
      finalized_payouts: [],
    },
  };
}

export async function routeJflMeNotifications(request, env = {}) {
  if (env?.ENVIRONMENT !== 'jfl' || !request) return null;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/me/matches') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    const rewritten = new Request(new URL('/api/me/scorable-matches', request.url), request);
    return { rewrite: rewritten };
  }

  if (path === '/api/me/membership-requests') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    const rewritten = new Request(new URL('/api/me/team-membership-requests', request.url), request);
    return { rewrite: rewritten };
  }

  if (INVITE_PATHS.has(path)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ invitations: [], playerId: null });
  }

  if (PRIZE_PATHS.has(path)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse(emptyPrizeSummary());
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

  if (TRADE_PATHS.has(path)) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    return jsonResponse({ tradeManagement: { trades: [] } });
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
