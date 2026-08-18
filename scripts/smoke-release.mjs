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
  const [healthResponse, environmentResponse] = await Promise.all([
    fetchImpl(`${base}/health`, { headers: requestHeaders('application/json', bypassToken) }),
    fetchImpl(`${base}/health/environment`, {
      headers: requestHeaders('application/json', bypassToken),
    }),
  ]);

  const { body: health } = await readJson(healthResponse, '/health');
  const { body: environment } = await readJson(environmentResponse, '/health/environment');
  const readiness = assertExpectedDeployment({
    health,
    environment,
    expectedEnvironment,
    expectedVersionTag,
  });
  if (!readiness.ready) return readiness;

  const homeResponse = await fetchImpl(`${base}/`, {
    headers: requestHeaders('text/html', bypassToken),
  });
  const homeBody = await homeResponse.text();
  if (!homeResponse.ok) {
    throw new Error(`/ failed with HTTP ${homeResponse.status}`);
  }
  if (!/Fremont Derby/i.test(homeBody)) {
    throw new Error('/ is serving an unexpected release surface');
  }

  const demoResponse = await fetchImpl(`${base}/demo`, {
    headers: requestHeaders('text/html', bypassToken),
  });
  const demoBody = await demoResponse.text();
  if (!demoResponse.ok) {
    throw new Error(`/demo failed with HTTP ${demoResponse.status}`);
  }
  if (!/Try a League Night/i.test(demoBody)) {
    throw new Error('/demo is serving an unexpected release surface');
  }

  return {
    ready: true,
    version: health.version,
    versionTag: health.versionTag,
    deployedAt: health.deployedAt,
    environment: environment.environment,
  };
}

export async function smokeRelease({
  baseUrl,
  expectedEnvironment,
  expectedVersionTag,
  bypassToken = '',
  attempts = defaultAttempts,
  delayMs = defaultDelayMs,
  fetchImpl = globalThis.fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  log = console.log,
}) {
  let lastReason = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
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
      lastReason = error instanceof Error ? error.message : String(error);
      if (isUnbypassedCloudflareChallenge(lastReason, bypassToken)) {
        throw new Error(
          'Cloudflare challenged the release smoke before the Worker and RELEASE_SMOKE_BYPASS_TOKEN is not configured. Configure the matching GitHub Actions secret and narrow Cloudflare x-fremont-release-smoke skip rule, then rerun.',
        );
      }
      if (/environment mismatch|readiness failed|wrong service|unexpected release surface/i.test(lastReason)) {
        throw error;
      }
    }

    if (attempt < attempts) {
      log(`Release smoke ${attempt}/${attempts}: ${lastReason}`);
      await sleep(delayMs);
    }
  }

  throw new Error(`Release did not become healthy: ${lastReason ?? 'unknown state'}`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  const [baseUrl, expectedEnvironment, expectedVersionTag] = process.argv.slice(2);
  smokeRelease({
    baseUrl,
    expectedEnvironment,
    expectedVersionTag,
    bypassToken: process.env.RELEASE_SMOKE_BYPASS_TOKEN || '',
  })
    .then((result) => {
      console.log(`Release smoke passed: ${JSON.stringify(result)}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
