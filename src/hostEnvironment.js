/** Hostname → expected Worker ENVIRONMENT for public Fremont Derby hosts. */
export const HOST_ENVIRONMENT_EXPECTATIONS = Object.freeze({
  'fremontderby.com': 'production',
  'www.fremontderby.com': 'production',
  'jfl.fremontderby.com': 'jfl',
  'dru.fremontderby.com': 'dru',
  'gamma.fremontderby.com': 'gamma',
});

export function normalizeRequestHost(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  // Strip port if present
  return raw.split(':')[0];
}

/**
 * @returns {string|null} expected environment, or null when host is unknown/local
 */
export function expectedEnvironmentForHost(host) {
  const normalized = normalizeRequestHost(host);
  if (!normalized) return null;
  return HOST_ENVIRONMENT_EXPECTATIONS[normalized] ?? null;
}

export function hostMatchesEnvironment(host, environment) {
  const expected = expectedEnvironmentForHost(host);
  if (!expected) return null; // unknown host — do not fail closed on preview URLs
  return expected === String(environment || '').trim();
}
