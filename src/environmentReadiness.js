const fixedExpectedSupabaseProjectRefs = {
  production: 'cpiucsxlkicmlbvdvhww',
  staging: 'oqkkvqkerusepyokzbmt',
};

const isolatedRuntimeEnvironments = new Set(['jfl', 'dru', 'gamma']);
const testAuthRuntimeEnvironments = new Set(['jfl', 'dru']);
const knownRuntimeEnvironments = new Set([
  ...Object.keys(fixedExpectedSupabaseProjectRefs),
  ...isolatedRuntimeEnvironments,
]);
const reservedSupabaseProjectRefs = new Set(Object.values(fixedExpectedSupabaseProjectRefs));

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

function configuredExpectedProjectRef(env, environment) {
  if (environment in fixedExpectedSupabaseProjectRefs) {
    return fixedExpectedSupabaseProjectRefs[environment];
  }
  if (!isolatedRuntimeEnvironments.has(environment)) return null;
  return configured(env.EXPECTED_SUPABASE_PROJECT_REF)
    ? env.EXPECTED_SUPABASE_PROJECT_REF.trim()
    : null;
}

export function environmentReadiness(env = {}) {
  const environment = String(env.ENVIRONMENT || 'production').trim() || 'production';
  const supabaseUrl = normalizeSupabaseUrl(env.SUPABASE_URL);
  const projectRef = supabaseProjectRefFromUrl(supabaseUrl);
  const hasPublishableKey = configured(env.SUPABASE_PUBLISHABLE_KEY);
  const hasServiceRoleKey = configured(env.SUPABASE_SERVICE_ROLE_KEY);
  const keysAreDistinct = hasPublishableKey && hasServiceRoleKey
    ? env.SUPABASE_PUBLISHABLE_KEY !== env.SUPABASE_SERVICE_ROLE_KEY
    : null;

  const isIsolatedRuntime = isolatedRuntimeEnvironments.has(environment);
  const isTestAuthRuntime = testAuthRuntimeEnvironments.has(environment);
  const expectedProjectRef = configuredExpectedProjectRef(env, environment);
  const expectedProjectConfigured = !isIsolatedRuntime || Boolean(expectedProjectRef);
  const expectedProjectIsolated = !isIsolatedRuntime
    || Boolean(expectedProjectRef && !reservedSupabaseProjectRefs.has(expectedProjectRef));
  const actualProjectIsolated = !isIsolatedRuntime
    || Boolean(projectRef && !reservedSupabaseProjectRefs.has(projectRef));
  const authBypassAllowed = isTestAuthRuntime;
  const authBypassEnabled = String(env.BETA_AUTH_BYPASS || '').trim() === '1';

  const projectMatches = Boolean(
    expectedProjectRef
    && projectRef === expectedProjectRef
    && expectedProjectIsolated
    && actualProjectIsolated
  );

  const checks = [
    check('knownWorkerEnvironment', knownRuntimeEnvironments.has(environment), { environment }),
    check('supabaseUrlConfigured', configured(supabaseUrl)),
    check('supabaseUrlUsesExpectedHost', Boolean(projectRef), { projectRef }),
    check('expectedProjectRefConfigured', expectedProjectConfigured, { expectedProjectRef }),
    check('supabaseProjectMatchesEnvironment', projectMatches, {
      expectedProjectRef,
      projectRef,
    }),
    check('supabasePublishableKeyConfigured', hasPublishableKey),
    check('supabaseServiceRoleKeyConfigured', hasServiceRoleKey),
    check('supabaseKeysAreDistinct', keysAreDistinct === true, {
      evaluated: keysAreDistinct !== null,
    }),
    check('authBypassRestrictedToTestLane', !authBypassEnabled || authBypassAllowed, {
      authBypassAllowed,
      authBypassEnabled,
    }),
  ];

  if (isIsolatedRuntime) {
    checks.push(
      check('expectedProjectRefIsolated', expectedProjectIsolated, { expectedProjectRef }),
      check('actualProjectIsolated', actualProjectIsolated, { projectRef }),
    );
  }

  if (isTestAuthRuntime) {
    checks.push(
      check('testAuthBypassFlag', authBypassEnabled),
      check('testActorUserIdConfigured', configured(env.BETA_ACTOR_USER_ID)),
    );
  }

  return {
    ok: checks.every((item) => item.ok),
    environment,
    expectedSupabaseProjectRef: expectedProjectRef,
    supabase: {
      url: supabaseUrl || null,
      projectRef,
      hasPublishableKey,
      hasServiceRoleKey,
    },
    checks,
  };
}
