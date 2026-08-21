import { resolveTestPersonaActor } from './testPersona.js';
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
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function normalizeSupabaseUrl(value) { return stripTrailingSlashes(value); }
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

const testAuthEnvironments = new Set(['jfl', 'dru']);
export const TEST_LANE_DEFAULT_ACTORS = Object.freeze({
  dru: { id: '05d025ff-1c97-4070-a691-46a896fb9b83', email: 'dru-actor@fremontderby.com' },
  jfl: { id: 'b22805b6-92ba-44bd-a92e-0c82f0be6613', email: 'jfl-actor@fremontderby.com' },
});

export function betaAuthBypassEnabled(env = {}) {
  const environment = String(env.ENVIRONMENT || '').trim();
  if (!testAuthEnvironments.has(environment)) return false;
  const bypass = String(env.BETA_AUTH_BYPASS || '').trim().toLowerCase();
  if (bypass === '0' || bypass === 'false' || bypass === 'off') return false;
  return true;
}

export function resolveBetaBypassActor(env = {}) {
  const environment = String(env.ENVIRONMENT || '').trim();
  const defaults = TEST_LANE_DEFAULT_ACTORS[environment] || null;
  const id = String(env.BETA_ACTOR_USER_ID || defaults?.id || '').trim();
  if (!id) throw new AuthError('Test auth bypass is enabled but BETA_ACTOR_USER_ID is not configured', 500);
  return {
    id,
    email: String(env.BETA_ACTOR_EMAIL || defaults?.email || 'test-actor@localhost').trim() || 'test-actor@localhost',
    betaBypass: true,
  };
}

function maybeAssumeTestPersona(request, env, user) {
  return resolveTestPersonaActor(request, env, user) || user;
}

export async function authenticateSupabaseUser(request, env, { fetch: fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const token = bearerToken(request);
  if (!token && betaAuthBypassEnabled(env)) return resolveBetaBypassActor(env);
  if (!token) throw new AuthError('Missing bearer token');

  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const publishableKey = requireEnvValue(env, 'SUPABASE_PUBLISHABLE_KEY');
  const response = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: { apikey: publishableKey, authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  if (!response.ok) throw new AuthError('Invalid bearer token');
  const user = await parseJson(response);
  if (!user?.id) throw new AuthError('Authenticated user is missing an id');
  return maybeAssumeTestPersona(request, env, { id: user.id, email: user.email ?? null });
}
