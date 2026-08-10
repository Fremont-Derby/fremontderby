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

export async function authenticateSupabaseUser(
  request,
  env,
  { fetch: fetchImpl = globalThis.fetch } = {},
) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const token = bearerToken(request);
  if (!token) {
    throw new AuthError('Missing bearer token');
  }

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
