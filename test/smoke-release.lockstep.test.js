import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SMOKE_ATTEMPTS,
  DEFAULT_SMOKE_DELAY_MS,
  SMOKE_HEADER_NAME,
  normalizeBaseUrl,
  requestHeaders,
  isUnbypassedCloudflareChallenge,
  assertExpectedDeployment,
  checkReleaseOnce,
  smokeRelease,
} from '../scripts/smoke-release.mjs';

const TAG = 'abcdef0123456789abcdef0123456789abcdef01';

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

test('smoke defaults and header name are locked', () => {
  assert.equal(DEFAULT_SMOKE_ATTEMPTS, 30);
  assert.equal(DEFAULT_SMOKE_DELAY_MS, 10_000);
  assert.equal(SMOKE_HEADER_NAME, 'x-fremont-release-smoke');
  assert.equal(normalizeBaseUrl('https://fremontderby.com/'), 'https://fremontderby.com');
  assert.throws(() => normalizeBaseUrl(''), /baseUrl is required/);
  assert.deepEqual(requestHeaders('application/json', 'tok')[SMOKE_HEADER_NAME], 'tok');
  assert.equal(requestHeaders('application/json', '')[SMOKE_HEADER_NAME], undefined);
});

test('isUnbypassedCloudflareChallenge only trips on 403 challenge without token', () => {
  const reason =
    '/health did not return JSON (HTTP 403, content-type text/html, server cloudflare); body preview: Just a moment…';
  assert.equal(isUnbypassedCloudflareChallenge(reason, ''), true);
  assert.equal(isUnbypassedCloudflareChallenge(reason, 'tok'), false);
  assert.equal(isUnbypassedCloudflareChallenge('plain error', ''), false);
});

test('assertExpectedDeployment waits on versionTag and fails closed on env mismatch', () => {
  const healthy = {
    health: { service: 'fremontderby', ok: true, versionTag: TAG },
    environment: {
      service: 'fremontderby',
      environment: 'production',
      ok: true,
      versionTag: TAG,
    },
    expectedEnvironment: 'production',
    expectedVersionTag: TAG,
  };
  assert.deepEqual(assertExpectedDeployment(healthy), { ready: true });

  const waiting = assertExpectedDeployment({
    ...healthy,
    health: { ...healthy.health, versionTag: 'old' },
  });
  assert.equal(waiting.ready, false);
  assert.match(waiting.reason, /Waiting for Worker version tag/);

  assert.throws(
    () =>
      assertExpectedDeployment({
        ...healthy,
        environment: { ...healthy.environment, environment: 'gamma' },
      }),
    /environment mismatch/,
  );
});

test('checkReleaseOnce requires demo surface and matching tags', async () => {
  const result = await checkReleaseOnce({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: TAG,
    fetchImpl: async (url) => {
      if (url.endsWith('/health')) {
        return jsonResponse({ service: 'fremontderby', ok: true, versionTag: TAG, version: 'v1' });
      }
      if (url.endsWith('/health/environment')) {
        return jsonResponse({
          service: 'fremontderby',
          environment: 'production',
          ok: true,
          versionTag: TAG,
        });
      }
      if (url.endsWith('/demo')) {
        return new Response('<h1>Try a League Night</h1>', { status: 200 });
      }
      throw new Error(`unexpected ${url}`);
    },
  });
  assert.equal(result.ready, true);
  assert.equal(result.versionTag, TAG);

  await assert.rejects(
    () =>
      checkReleaseOnce({
        baseUrl: 'https://fremontderby.com',
        expectedEnvironment: 'production',
        expectedVersionTag: TAG,
        fetchImpl: async (url) => {
          if (url.endsWith('/health')) {
            return jsonResponse({ service: 'fremontderby', ok: true, versionTag: TAG });
          }
          if (url.endsWith('/health/environment')) {
            return jsonResponse({
              service: 'fremontderby',
              environment: 'production',
              ok: true,
              versionTag: TAG,
            });
          }
          return new Response('<h1>Wrong surface</h1>', { status: 200 });
        },
      }),
    /unexpected release surface/,
  );
});

test('smokeRelease retries soft waits then returns ready', async () => {
  let calls = 0;
  const result = await smokeRelease({
    baseUrl: 'https://fremontderby.com',
    expectedEnvironment: 'production',
    expectedVersionTag: TAG,
    attempts: 3,
    delayMs: 1,
    sleep: async () => {},
    log: () => {},
    fetchImpl: async (url) => {
      if (url.endsWith('/health')) {
        calls += 1;
        const tag = calls < 2 ? 'old' : TAG;
        return jsonResponse({ service: 'fremontderby', ok: true, versionTag: tag, version: 'v' });
      }
      if (url.endsWith('/health/environment')) {
        return jsonResponse({
          service: 'fremontderby',
          environment: 'production',
          ok: true,
          versionTag: TAG,
        });
      }
      return new Response('<h1>Try a League Night</h1>', { status: 200 });
    },
  });
  assert.equal(result.ready, true);
  assert.ok(calls >= 2);
});
