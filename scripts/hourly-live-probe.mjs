#!/usr/bin/env node
/**
 * Hourly public route probe for production + lane hosts.
 * Used by .github/workflows/hourly-live-probe.yml (self-hosted or ubuntu).
 */
const hosts = [
  process.env.PROBE_HOST,
  process.env.PROBE_WWW,
  process.env.PROBE_DRU,
  process.env.PROBE_JFL,
  process.env.PROBE_GAMMA,
].filter(Boolean);

const paths = [
  '/',
  '/schedule',
  '/teams',
  '/scorecard',
  '/standings',
  '/prizes',
  '/lineup',
  '/profile',
  '/admin',
  '/health',
  '/health/environment',
];

if (!hosts.length) {
  console.error('No PROBE_* hosts configured');
  process.exit(1);
}

let failures = 0;
for (const host of hosts) {
  const base = String(host).replace(/\/+$/, '');
  for (const path of paths) {
    const url = base + path;
    try {
      const response = await fetch(url, { redirect: 'manual' });
      const ok = response.status >= 200 && response.status < 400;
      console.log(ok ? 'OK' : 'FAIL', response.status, url);
      if (!ok) failures += 1;
    } catch (error) {
      console.log('FAIL', url, error?.message || error);
      failures += 1;
    }
  }
}

if (failures) {
  console.error('failures', failures);
  process.exit(1);
}

console.log('all probes passed', { hosts: hosts.length, paths: paths.length });
