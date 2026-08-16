/**
 * Canonical API path aliases (#950).
 * normalizeApiPathname() rewrites convenience paths before routing.
 */

/** @type {Record<string, string>} exact path rewrites */
export const EXACT_PATH_ALIASES = {
  '/api/me/matches': '/api/me/scorable-matches',
  '/api/me/membership-requests': '/api/me/team-membership-requests',
  '/api/me/dms': '/api/me/direct-message-inbox',
  '/api/me/direct-messages': '/api/me/direct-message-inbox',
  '/api/me/direct-conversations': '/api/me/direct-message-inbox',
  '/api/me/notifications/mark-all-read': '/api/me/notifications/read-all',
  '/api/me/ready-check': '/api/me/ready-checks',
  '/api/ready-checks/pending': '/api/me/ready-checks',
  '/api/trades': '/api/me/trades',
  '/api/me/trade-management': '/api/me/trades',
};

/**
 * Segment-template aliases applied when exact map misses.
 * Each entry: { match: (parts) => boolean, rewrite: (parts) => string }
 * parts are pathname.split('/') including leading ''.
 */
export const SEGMENT_ALIAS_RULES = [
  {
    // /api/seasons/:id/standings → team-standings
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'seasons' && p[4] === 'standings',
    apply: (p) => `/api/seasons/${p[3]}/team-standings`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'seasons' && p[4] === 'player-standings',
    apply: (p) => `/api/seasons/${p[3]}/individual-standings`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'seasons' && p[4] === 'rounds',
    apply: (p) => `/api/seasons/${p[3]}/schedule`,
  },
  {
    // Convenience: clients probing /playoffs get schedule (bracket is derived client-side today)
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'seasons' && (p[4] === 'playoffs' || p[4] === 'playoff-bracket'),
    apply: (p) => `/api/seasons/${p[3]}/schedule`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'seasons' && (p[4] === 'awards' || p[4] === 'prize-summary'),
    apply: (p) => `/api/seasons/${p[3]}/prizes`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'teams' && (p[4] === 'chat' || p[4] === 'team-messages'),
    apply: (p) => `/api/teams/${p[3]}/messages`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'team-matches' && p[4] === 'chat',
    apply: (p) => `/api/team-matches/${p[3]}/messages`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'teams' && p[4] === 'lineups',
    apply: (p) => `/api/teams/${p[3]}/lineup`,
  },
  {
    // POST body still supplies roundId; team comes from path (handled in router startForTeam).
    // Alias keeps /ready-check singular form discoverable for clients that only rewrite paths.
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'teams' && p[4] === 'ready-check',
    apply: (p) => `/api/teams/${p[3]}/ready-checks`,
  },
];

/**
 * @param {string} pathname
 * @returns {string}
 */
export function normalizeApiPathname(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/api/')) return pathname;
  if (EXACT_PATH_ALIASES[pathname]) return EXACT_PATH_ALIASES[pathname];
  const parts = pathname.split('/');
  for (const rule of SEGMENT_ALIAS_RULES) {
    if (rule.test(parts)) return rule.apply(parts);
  }
  return pathname;
}
