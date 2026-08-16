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
  '/api/me/team-invitations': '/api/me/invitations',
  '/api/me/invites': '/api/me/invitations',
  '/api/me/pending-ready-checks': '/api/me/ready-checks',
  '/api/ready-check': '/api/ready-checks',
  '/api/me/scorable': '/api/me/scorable-matches',
  '/api/me/score': '/api/me/scorable-matches',
  '/api/me/team-invites': '/api/me/invitations',
  '/api/me/standing-availability': '/api/me/profile/standing-availability',
  '/api/me/player-profile': '/api/me/profile',
  '/api/me/player': '/api/me/profile',
  '/api/me/notifications/mark-as-read-all': '/api/me/notifications/read-all',
  '/api/me/notifications/clear': '/api/me/notifications/read-all',
  '/api/me/lineups': '/api/me/teams',
  '/api/me/captain-teams': '/api/me/teams',
  '/api/me/scorecard': '/api/me/scorable-matches',
  '/api/me/races': '/api/me/scorable-matches',
  '/api/score/matches': '/api/me/scorable-matches',
  '/api/my-trades': '/api/me/trades',
  '/api/me/free-agent': '/api/me/teams',
  '/api/me/fa': '/api/me/teams',
};

/**
 * Segment-template aliases applied when exact map misses.
 * Each entry: { match: (parts) => boolean, rewrite: (parts) => string }
 * parts are pathname.split('/') including leading ''.
 */
export const SEGMENT_ALIAS_RULES = [
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'team-matches' && (p[4] === 'postseason' || p[4] === 'playoff-lineup'),
    apply: (p) => `/api/team-matches/${p[3]}/postseason-lineup`,
  },

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
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'seasons' && (p[4] === 'eligible-free-agents' || p[4] === 'free_agents'),
    apply: (p) => `/api/seasons/${p[3]}/free-agents`,
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
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'teams' && (p[4] === 'membership-requests' || p[4] === 'join-requests' || p[4] === 'join'),
    apply: (p) => `/api/teams/${p[3]}/membership-request`,
  },
  {
    // POST body still supplies roundId; team comes from path (handled in router startForTeam).
    // Alias keeps /ready-check singular form discoverable for clients that only rewrite paths.
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'teams' && p[4] === 'ready-check',
    apply: (p) => `/api/teams/${p[3]}/ready-checks`,
  },
  {
    test: (p) => p.length === 6 && p[1] === 'api' && p[2] === 'me' && p[3] === 'notifications' && p[5] === 'mark-as-read',
    apply: (p) => `/api/me/notifications/${p[4]}/read`,
  },
  {
    test: (p) => p.length === 4 && p[1] === 'api' && p[2] === 'direct-messages',
    apply: (p) => `/api/direct-conversations/${p[3]}/messages`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'direct-messages' && p[4] === 'read',
    apply: (p) => `/api/direct-conversations/${p[3]}/messages/read`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'teams' && (p[4] === 'practice-schedule' || p[4] === 'practices'),
    apply: (p) => `/api/teams/${p[3]}/practice`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'teams' && p[4] === 'roster',
    apply: (p) => `/api/me/teams`,
  },
  {
    test: (p) => p.length === 5 && p[1] === 'api' && p[2] === 'seasons' && p[4] === 'fa',
    apply: (p) => `/api/seasons/${p[3]}/free-agents`,
  },
  {
    test: (p) => p.length === 4 && p[1] === 'api' && p[2] === 'dms',
    apply: (p) => `/api/direct-conversations/${p[3]}/messages`,
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
