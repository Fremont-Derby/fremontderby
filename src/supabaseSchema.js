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

/** Public lane/default profile for this Worker schema. */
export function publicPostgrestProfile(schema) {
  return schema;
}

/** Privileged profile for this Worker schema (`private` on production/staging). */
export function privatePostgrestProfile(schema) {
  return schema === 'public' ? 'private' : `${schema}_private`;
}

/**
 * Resolve Accept-Profile / Content-Profile for a REST call.
 * - empty → public lane schema
 * - `private` or already-qualified `{schema}_private` → private profile for this lane
 * - any other value (including another lane’s schema) → forced back to this lane’s public schema
 */
export function resolvePostgrestProfile(schema, requestedProfile = '') {
  const requested = String(requestedProfile || '').trim().toLowerCase();
  const privateProfile = privatePostgrestProfile(schema);
  if (!requested) return schema;
  if (requested === 'private' || requested === privateProfile) return privateProfile;
  if (requested === schema) return schema;
  return schema;
}

function headerValue(headers, name) {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key ? headers[key] : null;
}

function setHeader(headers, name, value) {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  headers[key || name] = value;
}

function cloneHeaders(value) {
  if (!value) return {};
  if (value instanceof Headers) return Object.fromEntries(value.entries());
  if (Array.isArray(value)) return Object.fromEntries(value);
  return { ...value };
}

export function withSupabaseSchema(fetchImpl, env = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const schema = configuredSupabaseSchema(env);

  return (input, init = {}) => {
    const requestUrl = typeof input === 'string' || input instanceof URL
      ? new URL(input)
      : new URL(input.url);
    if (!requestUrl.pathname.startsWith('/rest/v1/')) return fetchImpl(input, init);

    const headers = cloneHeaders(init.headers);
    const requestedProfile = String(
      headerValue(headers, 'accept-profile') || headerValue(headers, 'content-profile') || '',
    ).toLowerCase();
    const profile = resolvePostgrestProfile(schema, requestedProfile);
    setHeader(headers, 'accept-profile', profile);
    setHeader(headers, 'content-profile', profile);
    return fetchImpl(input, { ...init, headers });
  };
}
