const expectedSupabaseProjectRefs = {
  production: 'cpiucsxlkicmlbvdvhww',
  staging: 'oqkkvqkerusepyokzbmt',
};

const reservedSupabaseProjectRefs = new Set(Object.values(expectedSupabaseProjectRefs));

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

export function environmentReadiness(env = {}) {
  const environment = env.ENVIRONMENT || 'production';
  const supabaseUrl = normalizeSupabaseUrl(env.SUPABASE_URL);
  const projectRef = supabaseProjectRefFromUrl(supabaseUrl);
  const hasPublishableKey = configured(env.SUPABASE_PUBLISHABLE_KEY);
  const hasServiceRoleKey = configured(env.SUPABASE_SERVICE_ROLE_KEY);
  const keysAreDistinct = hasPublishableKey && hasServiceRoleKey
    ? env.SUPABASE_PUBLISHABLE_KEY !== env.SUPABASE_SERVICE_ROLE_KEY
    : null;

  const isBeta = environment === 'beta';
  const expectedProjectRef = isBeta
    ? (configured(env.BETA_EXPECTED_SUPABASE_PROJECT_REF)
      ? env.BETA_EXPECTED_SUPABASE_PROJECT_REF.trim()
      : null)
    : (expectedSupabaseProjectRefs[environment] || null);

  const knownWorkerEnvironment =
    environment in expectedSupabaseProjectRefs || isBeta;

  const betaExpectedProjectConfigured = !isBeta || Boolean(expectedProjectRef);
  const betaExpectedProjectIsolated = !isBeta
    || Boolean(expectedProjectRef && !reservedSupabaseProjectRefs.has(expectedProjectRef));
  const betaActualProjectIsolated = !isBeta
    || Boolean(projectRef && !reservedSupabaseProjectRefs.has(projectRef));

  const projectMatches = isBeta
    ? Boolean(
      expectedProjectRef
      && betaExpectedProjectIsolated
      && betaActualProjectIsolated
      && projectRef === expectedProjectRef
    )
    : Boolean(expectedProjectRef && projectRef === expectedProjectRef);

  const checks = [
    check('knownWorkerEnvironment', knownWorkerEnvironment, { environment }),
    check('supabaseUrlConfigured', configured(supabaseUrl)),
    check('supabaseUrlUsesExpectedHost', Boolean(projectRef), { projectRef }),
    check('supabaseProjectMatchesEnvironment', projectMatches, {
      expectedProjectRef,
      projectRef,
    }),
    check('supabasePublishableKeyConfigured', hasPublishableKey),
    check('supabaseServiceRoleKeyConfigured', hasServiceRoleKey),
    check('supabaseKeysAreDistinct', keysAreDistinct === true, {
      evaluated: keysAreDistinct !== null,
    }),
  ];

  if (isBeta) {
    checks.push(
      check('betaExpectedProjectRefConfigured', betaExpectedProjectConfigured),
      check('betaExpectedProjectRefIsolated', betaExpectedProjectIsolated, { expectedProjectRef }),
      check('betaActualProjectIsolated', betaActualProjectIsolated, { projectRef }),
      check('betaAuthBypassFlag', String(env.BETA_AUTH_BYPASS || '').trim() === '1'),
      check('betaActorUserIdConfigured', configured(env.BETA_ACTOR_USER_ID)),
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
