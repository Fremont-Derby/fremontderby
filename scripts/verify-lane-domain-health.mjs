import { fileURLToPath } from 'node:url';

const defaultAttempts = 6;
const defaultDelayMs = 10_000;
const smokeHeaderName = 'x-fremont-release-smoke';

export const laneHealthTargets = Object.freeze([
  Object.freeze({ hostname: 'dru.fremontderby.com', expectedEnvironment: 'dru' }),
  Object.freeze({ hostname: 'jfl.fremontderby.com', expectedEnvironment: 'jfl' }),
  Object.freeze({ hostname: 'gamma.fremontderby.com', expectedEnvironment: 'gamma' }),
]);

function requestHeaders(bypassToken) {
  return {
    accept: 'application/json',
    ...(bypassToken ? { [smokeHeaderName]: bypassToken } : {}),
  };
}

async function readHealth(response, target) {
  if (!response?.ok) {
    throw new Error(`HTTP ${response?.status ?? 'unknown'}`);
  }

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error('health endpoint returned non-JSON');
  }

  if (body.service !== 'fremontderby') {
    throw new Error(`wrong service: ${body.service ?? 'unknown'}`);
  }
  if (body.environment !== target.expectedEnvironment) {
    throw new Error(
      `expected environment ${target.expectedEnvironment}, got ${body.environment ?? 'unknown'}`,
    );
  }
  if (body.ok !== true) {
    const failedChecks = Array.isArray(body.checks)
      ? body.checks
        .filter((check) => check?.ok !== true)
        .map((check) => check?.name)
        .filter(Boolean)
      : [];
    throw new Error(
      `readiness ok=false${failedChecks.length ? `: ${failedChecks.join(', ')}` : ''}`,
    );
  }

  return {
    hostname: target.hostname,
    environment: body.environment,
    versionTag: body.versionTag ?? null,
  };
}

export async function checkLaneHealthOnce({
  target,
  fetchImpl = globalThis.fetch,
  bypassToken = '',
} = {}) {
  if (!target?.hostname || !target?.expectedEnvironment) {
    throw new Error('target hostname and expectedEnvironment are required');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is required');
  }

  const response = await fetchImpl(`https://${target.hostname}/health/environment`, {
    headers: requestHeaders(bypassToken),
  });
  return readHealth(response, target);
}

export async function verifyLaneHealthTargets({
  targets = laneHealthTargets,
  attempts = defaultAttempts,
  delayMs = defaultDelayMs,
  fetchImpl = globalThis.fetch,
  bypassToken = '',
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  log = console.log,
} = {}) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error('attempts must be a positive integer');
  }

  const pending = new Map(targets.map((target) => [target.hostname, target]));
  const results = new Map();
  const lastReasons = new Map();

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const checks = [...pending.values()].map(async (target) => {
      try {
        const result = await checkLaneHealthOnce({ target, fetchImpl, bypassToken });
        results.set(target.hostname, result);
        pending.delete(target.hostname);
        log(`Lane health passed: ${target.hostname} -> ${result.environment}`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        lastReasons.set(target.hostname, reason);
        log(`Lane health ${attempt}/${attempts}: ${target.hostname}: ${reason}`);
      }
    });
    await Promise.all(checks);

    if (pending.size === 0) {
      return targets.map((target) => results.get(target.hostname));
    }
    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  const diagnostics = [...pending.values()]
    .map((target) => `${target.hostname}: ${lastReasons.get(target.hostname) ?? 'unknown failure'}`)
    .join('; ');
  throw new Error(`Lane health verification failed after ${attempts} attempts: ${diagnostics}`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  verifyLaneHealthTargets({
    bypassToken: process.env.RELEASE_SMOKE_BYPASS_TOKEN || '',
  })
    .then((results) => {
      console.log(`Lane health verification passed: ${JSON.stringify(results)}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
