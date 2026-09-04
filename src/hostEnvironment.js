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
  return raw.split(':')[0];
}

export function expectedEnvironmentForHost(host) {
  const normalized = normalizeRequestHost(host);
  if (!normalized) return null;
  return HOST_ENVIRONMENT_EXPECTATIONS[normalized] ?? null;
}

export function hostMatchesEnvironment(host, environment) {
  const expected = expectedEnvironmentForHost(host);
  if (!expected) return null;
  return expected === String(environment || '').trim();
}
