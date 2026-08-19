/**
 * Assert public lane hosts report the expected ENVIRONMENT identity.
 * Usage: node scripts/assert-lane-health.mjs
 * Exit 1 on any mismatch or transport failure.
 */
import { fileURLToPath } from 'node:url';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

/** Derived from HOST_ENVIRONMENT_EXPECTATIONS so host/env identity cannot drift. */
export const LANE_HEALTH_CHECKS = Object.freeze(
  Object.entries(HOST_ENVIRONMENT_EXPECTATIONS).map(([host, expect]) =>
    Object.freeze({ host, expect }),
  ),
);

export function evaluateLaneHealthBody(host, expect, responseStatus, text) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return {
      ok: false,
      host,
      expect,
      error: `${host}: non-JSON health body: ${String(text).slice(0, 120)}`,
    };
  }
  const environment = body?.environment;
  const readinessOk = body?.ok === true;
  if (responseStatus < 200 || responseStatus >= 300) {
    const failedChecks = Array.isArray(body?.checks)
      ? body.checks.filter((c) => !c.ok).map((c) => c.name).join(',')
      : '';
    const project = body?.supabase?.projectRef || '';
    const detail = [failedChecks && `failed=${failedChecks}`, project && `projectRef=${project}`]
      .filter(Boolean)
      .join(' ');
    return {
      ok: false,
      host,
      expect,
      environment,
      readinessOk,
      error: `${host}: HTTP ${responseStatus}${detail ? ` (${detail})` : ''}`,
    };
  }
  if (environment !== expect) {
    return {
      ok: false,
      host,
      expect,
      environment,
      error: `${host}: environment="${environment}" expected="${expect}"`,
    };
  }
  if (body.hostMatchesEnvironment === false) {
    return {
      ok: false,
      host,
      expect,
      environment,
      readinessOk,
      error: `${host}: hostMatchesEnvironment=false (host/env mismatch)`,
    };
  }
  return {
    ok: true,
    host,
    expect,
    environment,
    readinessOk,
  };
}

export async function probeLaneHealth({ host, expect }, fetchImpl = fetch) {
  const url = `https://${host}/health/environment`;
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'fremontderby-lane-health' },
  });
  const text = await response.text();
  return evaluateLaneHealthBody(host, expect, response.status, text);
}

export async function assertAllLaneHealth(checks = LANE_HEALTH_CHECKS, fetchImpl = fetch) {
  const results = [];
  for (const check of checks) {
    try {
      results.push(await probeLaneHealth(check, fetchImpl));
    } catch (error) {
      results.push({
        ok: false,
        host: check.host,
        expect: check.expect,
        error: String(error.message || error),
      });
    }
  }
  const failed = results.filter((row) => !row.ok);
  return {
    ok: failed.length === 0,
    results,
    failed,
  };
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const summary = await assertAllLaneHealth();
  for (const row of summary.results) {
    console.log(JSON.stringify(row));
  }
  if (!summary.ok) {
    console.error(
      `Lane health failed (${summary.failed.length}/${summary.results.length}). Domain attach is not enough; deploy --env with vars from wrangler.jsonc.`,
    );
    process.exit(1);
  }
  console.log('All lane health identities OK.');
}
