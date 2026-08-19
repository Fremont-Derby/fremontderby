#!/usr/bin/env node
/**
 * Hourly public route probe for production + lane hosts.
 * Used by .github/workflows/hourly-live-probe.yml (self-hosted or ubuntu).
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const ACTION_PROBE_ENV_KEYS = Object.freeze([
  'PROBE_HOST',
  'PROBE_WWW',
  'PROBE_DRU',
  'PROBE_JFL',
  'PROBE_GAMMA',
]);

export const ACTION_PROBE_PATHS = Object.freeze([
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
]);

export function resolveActionProbeHosts(env = process.env) {
  return ACTION_PROBE_ENV_KEYS.map((key) => env[key]).filter(Boolean).map((host) =>
    String(host).replace(/\/+$/, ''),
  );
}

export function isProbeHttpOk(status) {
  return Number(status) >= 200 && Number(status) < 400;
}

/**
 * Pure probe runner. Injectable fetch. Returns { failures, results, hosts, paths }.
 */
export async function runActionLiveProbes({
  hosts = resolveActionProbeHosts(),
  paths = ACTION_PROBE_PATHS,
  fetchImpl = fetch,
} = {}) {
  if (!hosts.length) {
    return {
      failures: 1,
      results: [],
      hosts,
      paths,
      error: 'No PROBE_* hosts configured',
    };
  }

  const results = [];
  let failures = 0;
  for (const base of hosts) {
    for (const path of paths) {
      const url = base + path;
      try {
        const response = await fetchImpl(url, { redirect: 'manual' });
        const ok = isProbeHttpOk(response.status);
        results.push({ ok, status: response.status, url });
        if (!ok) failures += 1;
      } catch (error) {
        failures += 1;
        results.push({
          ok: false,
          status: 0,
          url,
          error: String(error?.message || error),
        });
      }
    }
  }

  return { failures, results, hosts, paths };
}

const isDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirect) {
  const summary = await runActionLiveProbes();
  if (summary.error) {
    console.error(summary.error);
    process.exit(1);
  }
  for (const row of summary.results) {
    if (row.ok) console.log('OK', row.status, row.url);
    else console.log('FAIL', row.status || row.error, row.url);
  }
  if (summary.failures) {
    console.error('failures', summary.failures);
    process.exit(1);
  }
  console.log('all probes passed', {
    hosts: summary.hosts.length,
    paths: summary.paths.length,
  });
}
