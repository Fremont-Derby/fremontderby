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
const testAuthRuntimeEnvironments = new Set(['jfl', 'dru']);
const knownRuntimeEnvironments = new Set(Object.keys(fixedExpectedSupabaseProjectRefs));

function normalizeSupabaseUrl(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\/+$/, '');
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

function publicChecks(checks) {
  return checks.map(({ name, ok }) => ({ name, ok }));
}

export function environmentReadiness(env = {}) {
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
  const authBypassEnabled = String(env.BETA_AUTH_BYPASS || '').trim() === '1';
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
    check('authBypassRestrictedToTestLane', !authBypassEnabled || authBypassAllowed, {
      authBypassAllowed,
      authBypassEnabled,
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
      check('testActorUserIdConfigured', configured(env.BETA_ACTOR_USER_ID)),
    );
  }

  const ok = checks.every((item) => item.ok);
  const isBoundWorkerRuntime = Boolean(env.CF_VERSION_METADATA);

  if (isBoundWorkerRuntime) {
    return {
      ok,
      environment,
      expectedSupabaseSchema: expectedSchema,
      checks: publicChecks(checks),
    };
  }

  return {
    ok,
    environment,
    expectedSupabaseProjectRef: expectedProjectRef,
    expectedSupabaseSchema: expectedSchema,
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
