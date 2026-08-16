/**
 * Split-based path matchers for hot /api/teams/:id/… routes.
 * Split matchers for chat/lineup families (#948 progress).
 * Pair with pathAliases.normalizeApiPathname (#950) before routing.
 */

/**
 * @param {string} pathname
 * @returns {null | { kind: 'ready-checks' } | { kind: 'messages' | 'messages-read' | 'membership-request', teamId: string }}
 */
export function matchApiTeamsPath(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/api/teams/')) {
    return null;
  }

  // '/api/teams/…' → ['', 'api', 'teams', …]
  const parts = pathname.split('/');
  if (parts.length < 4 || parts[1] !== 'api' || parts[2] !== 'teams') {
    return null;
  }

  const segment = parts[3];
  if (!segment) return null;

  if (segment === 'ready-checks') {
    return parts.length === 4 ? { kind: 'ready-checks' } : null;
  }

  const teamId = decodeURIComponent(segment);
  const a = parts[4];
  const b = parts[5];

  if (!a) return null;

  if (a === 'messages' || a === 'chat' || a === 'team-messages') {
    if (parts.length === 5) return { kind: 'messages', teamId };
    if (a === 'messages' && b === 'read' && parts.length === 6) {
      return { kind: 'messages-read', teamId };
    }
    return null;
  }

  if (a === 'membership-request' && parts.length === 5) {
    return { kind: 'membership-request', teamId };
  }

  return null;
}

/**
 * Regex baseline for benchmarks only (mirrors historical router patterns).
 * @param {string} pathname
 */
export function matchApiTeamsPathRegex(pathname) {
  let m = pathname.match(/^\/api\/teams\/([^/]+)\/(?:messages|chat|team-messages)$/);
  if (m) return { kind: 'messages', teamId: decodeURIComponent(m[1]) };
  m = pathname.match(/^\/api\/teams\/([^/]+)\/messages\/read$/);
  if (m) return { kind: 'messages-read', teamId: decodeURIComponent(m[1]) };
  m = pathname.match(/^\/api\/teams\/([^/]+)\/membership-request$/);
  if (m) return { kind: 'membership-request', teamId: decodeURIComponent(m[1]) };
  if (pathname === '/api/teams/ready-checks') return { kind: 'ready-checks' };
  return null;
}


/**
 * @param {string} pathname
 * @returns {null | { kind: 'messages' | 'messages-read' | 'team-choice' | 'postseason-lineup', teamMatchId: string }}
 */
export function matchApiTeamMatchesPath(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/api/team-matches/')) {
    return null;
  }
  const parts = pathname.split('/');
  // ['', 'api', 'team-matches', id, ...]
  if (parts.length < 5 || parts[1] !== 'api' || parts[2] !== 'team-matches' || !parts[3]) {
    return null;
  }
  const teamMatchId = decodeURIComponent(parts[3]);
  const a = parts[4];
  const b = parts[5];
  if (!a) return null;

  if (a === 'messages' || a === 'chat') {
    if (parts.length === 5) return { kind: 'messages', teamMatchId };
    if (a === 'messages' && b === 'read' && parts.length === 6) {
      return { kind: 'messages-read', teamMatchId };
    }
    return null;
  }
  if (a === 'team-choice' && b === 'me' && parts.length === 6) {
    return { kind: 'team-choice', teamMatchId };
  }
  if (a === 'postseason-lineup' && parts.length === 5) {
    return { kind: 'postseason-lineup', teamMatchId };
  }
  return null;
}

/**
 * Season league chat only (not full /api/seasons tree).
 * @param {string} pathname
 * @returns {null | { kind: 'messages' | 'messages-read', seasonId: string }}
 */
export function matchApiSeasonMessagesPath(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/api/seasons/')) {
    return null;
  }
  const parts = pathname.split('/');
  // ['', 'api', 'seasons', id, 'messages', ...]
  if (parts.length < 5 || parts[1] !== 'api' || parts[2] !== 'seasons' || !parts[3]) {
    return null;
  }
  if (parts[4] !== 'messages') return null;
  const seasonId = decodeURIComponent(parts[3]);
  if (parts.length === 5) return { kind: 'messages', seasonId };
  if (parts.length === 6 && parts[5] === 'read') return { kind: 'messages-read', seasonId };
  return null;
}
