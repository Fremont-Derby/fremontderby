const expectedSupabaseProjectRefs = {
  production: 'cpiucsxlkicmlbvdvhww',
  staging: 'oqkkvqkerusepyokzbmt',
};

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
  const expectedProjectRef = expectedSupabaseProjectRefs[environment] || null;
  const hasPublishableKey = configured(env.SUPABASE_PUBLISHABLE_KEY);
  const hasServiceRoleKey = configured(env.SUPABASE_SERVICE_ROLE_KEY);
  const knownWorkerEnvironment = environment in expectedSupabaseProjectRefs;
  const keysAreDistinct = hasPublishableKey && hasServiceRoleKey
    ? env.SUPABASE_PUBLISHABLE_KEY !== env.SUPABASE_SERVICE_ROLE_KEY
    : null;

  const checks = [
    check('knownWorkerEnvironment', knownWorkerEnvironment, { environment }),
    check('supabaseUrlConfigured', configured(supabaseUrl)),
    check('supabaseUrlUsesExpectedHost', Boolean(projectRef), { projectRef }),
    check(
      'supabaseProjectMatchesEnvironment',
      Boolean(expectedProjectRef && projectRef === expectedProjectRef),
      { expectedProjectRef, projectRef },
    ),
    check('supabasePublishableKeyConfigured', hasPublishableKey),
    check('supabaseServiceRoleKeyConfigured', hasServiceRoleKey),
    check('supabaseKeysAreDistinct', keysAreDistinct === true, {
      evaluated: keysAreDistinct !== null,
    }),
  ];

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
