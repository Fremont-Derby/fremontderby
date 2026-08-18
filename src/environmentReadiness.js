import { expectedEnvironmentForHost, hostMatchesEnvironment, normalizeRequestHost } from './hostEnvironment.js';
import { TEST_LANE_DEFAULT_ACTORS } from './supabaseAuth.js';
import { stripTrailingSlashes } from './stripTrailingSlashes.js';

const fixedExpectedSupabaseProjectRefs = {
  production: 'cpiucsxlkicmlbvdvhww',
  staging: 'oqkkvqkerusepyokzbmt',
  jfl: 'oqkkvqkerusepyokzbmt',
  dru: 'oqkkvqkerusepyokzbmt',
  gamma: 'oqkkvqkerusepyokzbmt',
};

const expectedSchemas = {
  production: 'public',
  staging: 'public',
  jfl: 'jfl',
  dru: 'dru',
  gamma: 'gamma',
};

const isolatedRuntimeEnvironments = new Set(['jfl', 'dru', 'gamma']);
/** Open-auth is jfl/dru only — gamma is production-like. */
const testAuthRuntimeEnvironments = new Set(['jfl', 'dru']);
const knownRuntimeEnvironments = new Set(Object.keys(fixedExpectedSupabaseProjectRefs));

function normalizeSupabaseUrl(value) {
  if (!value || typeof value !== 'string') return '';
  return stripTrailingSlashes(value.trim());
}

export function supabaseProjectRefFromUrl(value) {
  const url = normalizeSupabaseUrl(value);
  if (!url) return null;
  try {
    const host = new URL(url).host;
    const [projectRef, service, domain] = host.split('.');
    if (service !== 'supabase' || domain !== 'co') return null;
    return projectRef || null;
  } catch {
    return null;
  }
}

function configured(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function check(name, ok, details = {}) {
  return { name, ok: Boolean(ok), ...details };
}

export function environmentReadiness(env = {}, options = {}) {
  const environment = String(env.ENVIRONMENT || 'production').trim() || 'production';
  const supabaseUrl = normalizeSupabaseUrl(env.SUPABASE_URL);
  const projectRef = supabaseProjectRefFromUrl(supabaseUrl);
  const schema = String(env.SUPABASE_SCHEMA || expectedSchemas[environment] || '').trim();
  const expectedProjectRef = fixedExpectedSupabaseProjectRefs[environment] ?? null;
  const expectedSchema = expectedSchemas[environment] ?? null;
  const hasPublishableKey = configured(env.SUPABASE_PUBLISHABLE_KEY);
  const hasServiceRoleKey = configured(env.SUPABASE_SERVICE_ROLE_KEY);
  const keysAreDistinct = hasPublishableKey && hasServiceRoleKey
    ? env.SUPABASE_PUBLISHABLE_KEY !== env.SUPABASE_SERVICE_ROLE_KEY
    : null;
  const isIsolatedRuntime = isolatedRuntimeEnvironments.has(environment);
  const isTestAuthRuntime = testAuthRuntimeEnvironments.has(environment);
  const authBypassAllowed = isTestAuthRuntime;
  const bypassRaw = String(env.BETA_AUTH_BYPASS || '').trim().toLowerCase();
  const authBypassEnabled = isTestAuthRuntime && bypassRaw !== '0' && bypassRaw !== 'false' && bypassRaw !== 'off';
  const projectMatches = Boolean(expectedProjectRef && projectRef === expectedProjectRef);
  const schemaMatches = Boolean(expectedSchema && schema === expectedSchema);
  const actualProjectIsolated = !isIsolatedRuntime
    || Boolean(projectRef && projectRef !== fixedExpectedSupabaseProjectRefs.production);

  const checks = [
    check('knownWorkerEnvironment', knownRuntimeEnvironments.has(environment), { environment }),
    check('supabaseUrlConfigured', configured(supabaseUrl)),
    check('supabaseUrlUsesExpectedHost', Boolean(projectRef), { projectRef }),
    check('expectedProjectRefConfigured', Boolean(expectedProjectRef), { expectedProjectRef }),
    check('supabaseProjectMatchesEnvironment', projectMatches, { expectedProjectRef, projectRef }),
    check('supabaseSchemaConfigured', configured(schema), { schema }),
    check('supabaseSchemaMatchesEnvironment', schemaMatches, { expectedSchema, schema }),
    check('supabasePublishableKeyConfigured', hasPublishableKey),
    check('supabaseServiceRoleKeyConfigured', hasServiceRoleKey),
    check('supabaseKeysAreDistinct', keysAreDistinct === true, { evaluated: keysAreDistinct !== null }),
    check('authBypassRestrictedToTestLane', !(bypassRaw === '1' || bypassRaw === 'true' || bypassRaw === 'on') || authBypassAllowed, {
      authBypassAllowed,
      authBypassEnabled,
      bypassRaw,
    }),
  ];

  if (isIsolatedRuntime) {
    checks.push(
      check('expectedProjectRefIsolated', expectedProjectRef !== fixedExpectedSupabaseProjectRefs.production, { expectedProjectRef }),
      check('actualProjectIsolated', actualProjectIsolated, { projectRef }),
    );
  }
  if (isTestAuthRuntime) {
    checks.push(
      check('testAuthBypassFlag', authBypassEnabled),
      check('testActorUserIdConfigured', configured(env.BETA_ACTOR_USER_ID) || Boolean(TEST_LANE_DEFAULT_ACTORS[environment])),
    );
  }

  const host = normalizeRequestHost(options.host || env.REQUEST_HOST || '');
  const expectedHostEnvironment = host ? expectedEnvironmentForHost(host) : null;
  const hostMatch = host ? hostMatchesEnvironment(host, environment) : null;
  if (expectedHostEnvironment) {
    checks.push(
      check('requestHostMatchesWorkerEnvironment', hostMatch === true, {
        host,
        expectedHostEnvironment,
        environment,
      }),
    );
  }

  const expectedPrivateSchema = expectedSchema
    ? (expectedSchema === 'public' ? 'private' : `${expectedSchema}_private`)
    : null;

  return {
    ok: checks.every((item) => item.ok),
    environment,
    host: host || null,
    expectedHostEnvironment,
    hostMatchesEnvironment: hostMatch,
    expectedSupabaseProjectRef: expectedProjectRef,
    expectedSupabaseSchema: expectedSchema,
    expectedPrivateSupabaseSchema: expectedPrivateSchema,
    supabase: {
      url: supabaseUrl || null,
      projectRef,
      schema: schema || null,
      hasPublishableKey,
      hasServiceRoleKey,
    },
    checks,
  };
}
