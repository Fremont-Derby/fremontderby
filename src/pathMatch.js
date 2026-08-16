/**
 * Split-based path matchers for hot /api/teams/:id/… routes.
 * Prototype toward #948 (route table) — no regex, no backtracking.
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
