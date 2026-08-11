import { fileURLToPath } from 'node:url';

const defaultAttempts = 30;
const defaultDelayMs = 10_000;

function normalizeBaseUrl(value) {
  if (!value || typeof value !== 'string') throw new Error('baseUrl is required');
  return value.trim().replace(/\/+$/, '');
}

async function readJson(response, label) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${label} did not return JSON`);
  }
  return { response, body };
}

function assertExpectedDeployment({ health, environment, expectedEnvironment, expectedVersionTag }) {
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
  fetchImpl = globalThis.fetch,
}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  if (!expectedEnvironment) throw new Error('expectedEnvironment is required');
  if (!expectedVersionTag) throw new Error('expectedVersionTag is required');

  const base = normalizeBaseUrl(baseUrl);
  const [healthResult, environmentResult] = await Promise.all([
    fetchImpl(`${base}/health`, { headers: { accept: 'application/json' } }),
    fetchImpl(`${base}/health/environment`, { headers: { accept: 'application/json' } }),
  ]);

  const { body: health } = await readJson(healthResult, '/health');
  const { body: environment } = await readJson(environmentResult, '/health/environment');

  if (!healthResult.ok) {
    throw new Error(`/health failed with HTTP ${healthResult.status}`);
  }

  const deployment = assertExpectedDeployment({
    health,
    environment,
    expectedEnvironment,
    expectedVersionTag,
  });
  if (!deployment.ready) return deployment;

  if (!environmentResult.ok) {
    throw new Error(`/health/environment failed with HTTP ${environmentResult.status}`);
  }

  const demoResponse = await fetchImpl(`${base}/demo`, { headers: { accept: 'text/html' } });
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
        fetchImpl,
      });
      if (result.ready) return result;
      lastReason = result.reason;
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
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
  smokeRelease({ baseUrl, expectedEnvironment, expectedVersionTag })
    .then((result) => {
      console.log(`Release smoke passed: ${JSON.stringify(result)}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
