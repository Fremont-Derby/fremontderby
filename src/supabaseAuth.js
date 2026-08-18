export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function bearerToken(request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

const TEST_LANE_DEFAULT_ACTORS = Object.freeze({
  jfl: Object.freeze({
    id: '00000000-0000-4000-8000-000000000001',
    email: 'jfl-actor@fremontderby.com',
  }),
  dru: Object.freeze({
    id: '00000000-0000-4000-8000-000000000002',
    email: 'dru-actor@fremontderby.com',
  }),
});

// Gamma is a release-candidate lane: real auth only. JFL/DRU remain automation lanes.
const testAuthEnvironments = new Set(['jfl', 'dru']);

export { TEST_LANE_DEFAULT_ACTORS };

/**
 * Production always uses normal authentication.
 *
 * For jfl/dru, bypass defaults ON unless explicitly disabled (BETA_AUTH_BYPASS=0).
 * That matches wrangler.jsonc and keeps automation working when dashboard vars lag.
 */
export function betaAuthBypassEnabled(env = {}) {
  const environment = String(env.ENVIRONMENT || '').trim();
  if (!testAuthEnvironments.has(environment)) return false;
  const bypass = String(env.BETA_AUTH_BYPASS || '').trim().toLowerCase();
  if (bypass === '0' || bypass === 'false' || bypass === 'off') return false;
  // Explicit 1, or unset/empty on a test lane → enabled
  return true;
}

export function resolveBetaBypassActor(env = {}) {
  const environment = String(env.ENVIRONMENT || '').trim();
  const defaults = TEST_LANE_DEFAULT_ACTORS[environment] || null;
  const id = String(env.BETA_ACTOR_USER_ID || defaults?.id || '').trim();
  if (!id) {
    throw new AuthError(
      'Test auth bypass is enabled but BETA_ACTOR_USER_ID is not configured',
      500,
    );
  }
  return {
    id,
    email:
      String(env.BETA_ACTOR_EMAIL || defaults?.email || 'test-actor@localhost').trim() ||
      'test-actor@localhost',
    betaBypass: true,
  };
}

export async function authenticateSupabaseUser(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const token = bearerToken(request);

  // Test-lane bypass is only for deliberately unauthenticated automation.
  // Once a caller supplies a bearer token, validate it normally rather than
  // silently substituting the shared lane actor.
  if (!token && betaAuthBypassEnabled(env)) {
    return resolveBetaBypassActor(env);
  }

  if (!token) {
    throw new AuthError('Missing Authorization bearer token', 401);
  }

  const supabaseUrl = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = String(env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (!supabaseUrl || !anonKey) {
    throw new AuthError('Supabase auth is not configured', 500);
  }

  const response = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  });

  if (!response.ok) {
    throw new AuthError('Invalid or expired session', 401);
  }

  const payload = await response.json().catch(() => ({}));
  const id = String(payload?.id || '').trim();
  if (!id) {
    throw new AuthError('Invalid or expired session', 401);
  }

  return {
    id,
    email: String(payload?.email || '').trim() || null,
    betaBypass: false,
  };
}
