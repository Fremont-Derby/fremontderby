import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertExpectedDeployment,
  isUnbypassedCloudflareChallenge,
  checkReleaseOnce,
} from '../scripts/smoke-release.mjs';

const SHA = 'a'.repeat(40);

function healthy(env = 'production') {
  return {
    health: { ok: true, service: 'fremontderby', versionTag: SHA, version: 'v1' },
    environment: {
      ok: true,
      service: 'fremontderby',
      environment: env,
      versionTag: SHA,
      checks: [{ name: 'knownWorkerEnvironment', ok: true }],
    },
  };
}

test('assertExpectedDeployment is ready when health + environment match SHA', () => {
  const { health, environment } = healthy();
  assert.deepEqual(
    assertExpectedDeployment({
      health,
      environment,
      expectedEnvironment: 'production',
      expectedVersionTag: SHA,
    }),
    { ready: true },
  );
});

test('assertExpectedDeployment waits when versionTag lags', () => {
  const { health, environment } = healthy();
  health.versionTag = 'old';
  const result = assertExpectedDeployment({
    health,
    environment,
    expectedEnvironment: 'production',
    expectedVersionTag: SHA,
  });
  assert.equal(result.ready, false);
  assert.match(result.reason, /Waiting for Worker version tag/);
});

test('assertExpectedDeployment fails closed on env mismatch and readiness failures', () => {
  const { health, environment } = healthy();
  environment.environment = 'gamma';
  assert.throws(
    () => assertExpectedDeployment({
      health,
      environment,
      expectedEnvironment: 'production',
      expectedVersionTag: SHA,
    }),
    /environment mismatch/,
  );

  const again = healthy();
  again.environment.ok = false;
  again.environment.checks = [{ name: 'supabaseProjectMatchesEnvironment', ok: false }];
  assert.throws(
    () => assertExpectedDeployment({
      health: again.health,
      environment: again.environment,
      expectedEnvironment: 'production',
      expectedVersionTag: SHA,
    }),
    /readiness failed.*supabaseProjectMatchesEnvironment/,
  );
});

test('isUnbypassedCloudflareChallenge only when no bypass token', () => {
  const reason = '/health did not return JSON (HTTP 403, server cloudflare); body preview: Just a moment';
  assert.equal(isUnbypassedCloudflareChallenge(reason, ''), true);
  assert.equal(isUnbypassedCloudflareChallenge(reason, 'token'), false);
  assert.equal(isUnbypassedCloudflareChallenge('plain failure', ''), false);
});

test('checkReleaseOnce requires demo surface and matching env with injected fetch', async () => {
  const { health, environment } = healthy('jfl');
  const result = await checkReleaseOnce({
    baseUrl: 'https://jfl.fremontderby.com',
    expectedEnvironment: 'jfl',
    expectedVersionTag: SHA,
    fetchImpl: async (url) => {
      if (String(url).endsWith('/health')) {
        return new Response(JSON.stringify(health), { status: 200 });
      }
      if (String(url).endsWith('/health/environment')) {
        return new Response(JSON.stringify(environment), { status: 200 });
      }
      if (String(url).endsWith('/demo')) {
        return new Response('<html>Try a League Night</html>', { status: 200 });
      }
      throw new Error(`unexpected ${url}`);
    },
  });
  assert.equal(result.ready, true);
  assert.equal(result.versionTag, SHA);
  assert.equal(result.environment, 'jfl');
});
