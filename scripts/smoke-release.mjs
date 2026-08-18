import { fileURLToPath } from 'node:url';
import { stripTrailingSlashes } from '../src/stripTrailingSlashes.js';

const defaultAttempts = 30;
const defaultDelayMs = 10_000;
const smokeHeaderName = 'x-fremont-release-smoke';

function normalizeBaseUrl(value) {
  if (!value || typeof value !== 'string') throw new Error('baseUrl is required');
  return stripTrailingSlashes(value.trim());
}

function compactBodyPreview(text, limit = 180) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function requestHeaders(accept, bypassToken) {
  const headers = { accept };
  if (bypassToken) headers[smokeHeaderName] = bypassToken;
  return headers;
}

function isUnbypassedCloudflareChallenge(reason, bypassToken) {
  if (bypassToken) return false;
  return /did not return JSON \(HTTP 403,[^)]*server cloudflare/i.test(reason)
    && /Just a moment/i.test(reason);
}

async function readJson(response, label) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    const details = [
      `HTTP ${response.status}`,
      `content-type ${response.headers.get('content-type') || 'unknown'}`,
    ];
    for (const [name, displayName] of [
      ['server', 'server'],
      ['cf-ray', 'cf-ray'],
      ['location', 'location'],
    ]) {
      const value = response.headers.get(name);
      if (value) details.push(`${displayName} ${value}`);
    }
    const preview = compactBodyPreview(text);
    throw new Error(
      `${label} did not return JSON (${details.join(', ')})${preview ? `; body preview: ${preview}` : ''}`,
    );
  }
  return { response, body };
}

export function assertExpectedDeployment({ health, environment, expectedEnvironment, expectedVersionTag }) {
  if (health.service !== 'fremontderby' || health.ok !== true) {
    throw new Error('Production /health did not identify a healthy Fremont Derby service');
  }
  if (health.versionTag !== expectedVersionTag) {
    return {
      ready: false,
      reason: `Waiting for Worker version tag ${expectedVersionTag}; currently ${health.versionTag ?? 'untagged'}`,
    };
  }
  if (environment.service !== 'fremontderby') {
    throw new Error('Production /health/environment returned the wrong service');
  }
  if (environment.environment !== expectedEnvironment) {
    throw new Error(
      `Production environment mismatch: expected ${expectedEnvironment}, got ${environment.environment ?? 'unknown'}`,
    );
  }
  if (environment.ok !== true) {
    const failures = Array.isArray(environment.checks)
      ? environment.checks.filter((item) => item?.ok !== true).map((item) => item?.name).filter(Boolean)
      : [];
    throw new Error(
      `Production environment readiness failed${failures.length ? `: ${failures.join(', ')}` : ''}`,
    );
  }
  if (environment.versionTag !== expectedVersionTag) {
    throw new Error('Environment health version does not match /health version');
  }
  return { ready: true };
}

export async function checkReleaseOnce({
  baseUrl,
  expectedEnvironment,
  expectedVersionTag,
  bypassToken = '',
  fetchImpl = globalThis.fetch,
}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  if (!expectedEnvironment) throw new Error('expectedEnvironment is required');
  if (!expectedVersionTag) throw new Error('expectedVersionTag is required');

  const base = normalizeBaseUrl(baseUrl);
  const [healthResult, environmentResult] = await Promise.all([
    fetchImpl(`${base}/health`, { headers: requestHeaders('application/json', bypassToken) }),
    fetchImpl(`${base}/health/environment`, { headers: requestHeaders('application/json', bypassToken) }),
  ]);

  let health;
  let environment;
  try {
    ({ body: health } = await readJson(healthResult, 'Production /health'));
    ({ body: environment } = await readJson(environmentResult, 'Production /health/environment'));
  } catch (error) {
    const reason = String(error.message || error);
    if (isUnbypassedCloudflareChallenge(reason, bypassToken)) {
      throw new Error(
        `${reason}. Cloudflare is challenging this probe; set RELEASE_SMOKE_BYPASS_TOKEN if Bot Fight Mode is enabled.`,
      );
    }
    throw error;
  }

  return assertExpectedDeployment({
    health,
    environment,
    expectedEnvironment,
    expectedVersionTag,
  });
}

export async function smokeRelease({
  baseUrl,
  expectedEnvironment,
  expectedVersionTag,
  attempts = defaultAttempts,
  delayMs = defaultDelayMs,
  bypassToken = '',
  fetchImpl = globalThis.fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  let lastReason = 'not attempted';
  for (let i = 0; i < attempts; i += 1) {
    try {
      const result = await checkReleaseOnce({
        baseUrl,
        expectedEnvironment,
        expectedVersionTag,
        bypassToken,
        fetchImpl,
      });
      if (result.ready) return result;
      lastReason = result.reason;
    } catch (error) {
      lastReason = String(error.message || error);
      // Fail fast on hard mismatches / challenge; only retry soft waits via ready:false path.
      if (!/Waiting for Worker version tag/.test(lastReason)) {
        throw error;
      }
    }
    if (i + 1 < attempts) await sleep(delayMs);
  }
  throw new Error(`Release smoke timed out after ${attempts} attempts: ${lastReason}`);
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  const baseUrl = process.env.RELEASE_BASE_URL || process.argv[2] || 'https://fremontderby.com';
  const expectedEnvironment = process.env.EXPECTED_ENVIRONMENT || 'production';
  const expectedVersionTag = process.env.EXPECTED_VERSION_TAG || process.argv[3] || '';
  const bypassToken = process.env.RELEASE_SMOKE_BYPASS_TOKEN || '';
  try {
    await smokeRelease({ baseUrl, expectedEnvironment, expectedVersionTag, bypassToken });
    console.log(`Release smoke OK ${baseUrl} tag=${expectedVersionTag}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
