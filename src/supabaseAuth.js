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
  return value.replace(/\/+$/, '');
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

/**
 * Beta/gamma open-auth: only when ENVIRONMENT is exactly "beta" and
 * BETA_AUTH_BYPASS is "1". Never active for production or staging.
 */
export function betaAuthBypassEnabled(env = {}) {
  const environment = String(env.ENVIRONMENT || '').trim();
  const bypass = String(env.BETA_AUTH_BYPASS || '').trim();
  return environment === 'beta' && bypass === '1';
}

export function resolveBetaBypassActor(env = {}) {
  const id = String(env.BETA_ACTOR_USER_ID || '').trim();
  if (!id) {
    throw new AuthError(
      'Beta auth bypass is enabled but BETA_ACTOR_USER_ID is not configured',
      500,
    );
  }
  return {
    id,
    email: String(env.BETA_ACTOR_EMAIL || 'beta-actor@localhost').trim() || 'beta-actor@localhost',
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

  if (!token && betaAuthBypassEnabled(env)) {
    return resolveBetaBypassActor(env);
  }

  if (!token) {
    throw new AuthError('Missing bearer token');
  }

  // Real bearer tokens still work on beta when provided.
  const supabaseUrl = normalizeSupabaseUrl(requireEnvValue(env, 'SUPABASE_URL'));
  const publishableKey = requireEnvValue(env, 'SUPABASE_PUBLISHABLE_KEY');
  const response = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (betaAuthBypassEnabled(env)) {
      return resolveBetaBypassActor(env);
    }
    throw new AuthError('Invalid bearer token');
  }

  const user = await parseJson(response);
  if (!user?.id) {
    throw new AuthError('Authenticated user is missing an id');
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}
