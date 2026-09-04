import { environmentReadiness } from './environmentReadiness.js';
import { expectedEnvironmentForHost, hostMatchesEnvironment, normalizeRequestHost } from './hostEnvironment.js';

function versionMetadata(env = {}) {
  const metadata = env.CF_VERSION_METADATA || {};
  return {
    id: metadata.id || 'local',
    tag: metadata.tag || null,
    timestamp: metadata.timestamp || null,
  };
}

export function buildDruEnvironmentPayload(request, env = {}) {
  const readiness = environmentReadiness(env);
  const version = versionMetadata(env);
  const host = normalizeRequestHost(request?.headers?.get?.('host') || new URL(request.url).host);
  const expectedHostEnvironment = expectedEnvironmentForHost(host);
  const matches = hostMatchesEnvironment(host, readiness.environment);
  const publicChecks = (readiness.checks || []).map((check) => {
    const copy = { ...check };
    delete copy.url;
    return copy;
  });

  return {
    status: readiness.ok ? 200 : 503,
    body: {
      service: 'fremontderby',
      version: version.id,
      versionTag: version.tag,
      deployedAt: version.timestamp,
      ok: readiness.ok,
      environment: readiness.environment,
      host,
      expectedHostEnvironment,
      hostMatchesEnvironment: matches,
      expectedSupabaseSchema: readiness.expectedSupabaseSchema,
      expectedSupabaseProjectRef: readiness.expectedSupabaseProjectRef,
      checks: publicChecks,
    },
  };
}

export function routeDruEnvironmentHealth(request, env = {}) {
  if (!request) return null;
  const path = new URL(request.url).pathname.replace(/\/$/, '') || '/';
  if (path !== '/health/environment') return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { 'cache-control': 'no-store' } });
  }
  const payload = buildDruEnvironmentPayload(request, env);
  return Response.json(payload.body, {
    status: payload.status,
    headers: { 'cache-control': 'no-store' },
  });
}
