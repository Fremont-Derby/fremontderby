import { stripTrailingSlashes } from './stripTrailingSlashes.js';
export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function requireEnvValue(env, name) {
  const value = env?.[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeSupabaseUrl(value) {
  return stripTrailingSlashes(value);
}

function bearerToken(request) {
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

/** Open-auth test lanes only. Gamma is production-like and must not bypass. */
const testAuthEnvironments = new Set(['jfl', 'dru']);

/** Known staging auth.users ids for isolated lane open-auth (see docs/dru-jfl-noauth-operator.md). */
export const TEST_LANE_DEFAULT_ACTORS = Object.freeze({
  dru: {
    id: '05d025ff-1c97-4070-a691-46a896fb9b83',
    email: 'dru-actor@fremontderby.com',
  },
  jfl: {
    id: 'b22805b6-92ba-44bd-a92e-0c82f0be6613',
    email: 'jfl-actor@fremontderby.com',
  },
});

/**
 * Open-auth is allowed only on isolated test lanes (jfl/dru).
 * Gamma is production-like; production always uses normal authentication.
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
    email: String(env.BETA_ACTOR_EMAIL || defaults?.email || `${environment}-actor@fremontderby.com`).trim(),
  };
}
