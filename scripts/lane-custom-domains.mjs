/**
 * Source of truth for Worker custom domains (#639).
 * Deploy must use wrangler --env so these routes stay attached; do not rely on ad-hoc API restore.
 */
export const LANE_CUSTOM_DOMAINS = Object.freeze([
  Object.freeze({ hostname: 'fremontderby.com', service: 'fremontderby-prod', env: 'production' }),
  Object.freeze({ hostname: 'dru.fremontderby.com', service: 'fremontderby-dru', env: 'dru' }),
  Object.freeze({ hostname: 'jfl.fremontderby.com', service: 'fremontderby-jfl', env: 'jfl' }),
  Object.freeze({ hostname: 'gamma.fremontderby.com', service: 'fremontderby-gamma', env: 'gamma' }),
]);

export function domainsForEnv(envName) {
  return LANE_CUSTOM_DOMAINS.filter((row) => row.env === envName);
}

export function assertWranglerRoutesCoverDomains(wranglerConfig) {
  const envs = wranglerConfig?.env || {};
  const missing = [];
  for (const row of LANE_CUSTOM_DOMAINS) {
    if (row.env === 'production') {
      const routes = wranglerConfig?.routes || [];
      const ok = routes.some((r) => r.pattern === row.hostname && r.custom_domain === true);
      if (!ok) missing.push(row.hostname);
      continue;
    }
    const lane = envs[row.env];
    const routes = lane?.routes || [];
    const ok = routes.some((r) => r.pattern === row.hostname && r.custom_domain === true);
    if (!ok) missing.push(row.hostname);
  }
  if (missing.length) {
    throw new Error(`wrangler routes missing custom_domain for: ${missing.join(', ')}`);
  }
  return true;
}
