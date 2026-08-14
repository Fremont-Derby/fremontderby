const runtimeSchemas = Object.freeze({
  production: 'public',
  staging: 'public',
  jfl: 'jfl',
  dru: 'dru',
  gamma: 'gamma',
});

function environmentName(env = {}) {
  return String(env.ENVIRONMENT || 'production').trim() || 'production';
}

export function expectedSupabaseSchema(environment) {
  return runtimeSchemas[environment] ?? null;
}

export function configuredSupabaseSchema(env = {}) {
  const environment = environmentName(env);
  const expected = expectedSupabaseSchema(environment);
  if (!expected) throw new Error(`Unknown Worker environment "${environment}"`);

  const configured = String(env.SUPABASE_SCHEMA || expected).trim();
  if (configured !== expected) {
    throw new Error(
      `SUPABASE_SCHEMA "${configured}" does not match Worker environment "${environment}"`,
    );
  }
  return configured;
}

export function withSupabaseSchema(fetchImpl, env = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const schema = configuredSupabaseSchema(env);

  return (input, init = {}) => {
    const requestUrl = typeof input === 'string' || input instanceof URL
      ? new URL(input)
      : new URL(input.url);
    if (!requestUrl.pathname.startsWith('/rest/v1/')) return fetchImpl(input, init);

    const headers = new Headers(init.headers);
    headers.set('accept-profile', schema);
    headers.set('content-profile', schema);
    return fetchImpl(input, { ...init, headers });
  };
}
