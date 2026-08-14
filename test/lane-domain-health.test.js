import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkLaneHealthOnce,
  laneHealthTargets,
  verifyLaneHealthTargets,
} from '../scripts/verify-lane-domain-health.mjs';

function healthResponse(environment, overrides = {}, status = 200) {
  return new Response(JSON.stringify({
    service: 'fremontderby',
    environment,
    ok: true,
    versionTag: 'test-sha',
    ...overrides,
  }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('accepts healthy public endpoints for every expected lane', async () => {
  const results = await verifyLaneHealthTargets({
    attempts: 1,
    log: () => {},
    fetchImpl: async (url) => {
      const hostname = new URL(url).hostname;
      const target = laneHealthTargets.find((item) => item.hostname === hostname);
      return healthResponse(target.expectedEnvironment);
    },
  });

  assert.deepEqual(
    results.map(({ hostname, environment }) => ({ hostname, environment })),
    laneHealthTargets.map(({ hostname, expectedEnvironment }) => ({
      hostname,
      environment: expectedEnvironment,
    })),
  );
});

test('rejects a hostname serving the wrong Worker environment after bounded retries', async () => {
  let calls = 0;
  let sleeps = 0;
  await assert.rejects(
    verifyLaneHealthTargets({
      targets: [laneHealthTargets[0]],
      attempts: 2,
      delayMs: 1,
      log: () => {},
      sleep: async () => { sleeps += 1; },
      fetchImpl: async () => {
        calls += 1;
        return healthResponse('production');
      },
    }),
    /failed after 2 attempts: dru\.fremontderby\.com: expected environment dru, got production/,
  );
  assert.equal(calls, 2);
  assert.equal(sleeps, 1);
});

test('rejects unhealthy readiness and reports failed check names', async () => {
  await assert.rejects(
    checkLaneHealthOnce({
      target: laneHealthTargets[1],
      fetchImpl: async () => healthResponse('jfl', {
        ok: false,
        checks: [
          { name: 'supabaseProjectMatchesEnvironment', ok: false },
          { name: 'serviceRolePresent', ok: true },
        ],
      }),
    }),
    /readiness ok=false: supabaseProjectMatchesEnvironment/,
  );
});

test('rejects non-success HTTP responses without logging their body', async () => {
  await assert.rejects(
    checkLaneHealthOnce({
      target: laneHealthTargets[2],
      fetchImpl: async () => healthResponse('gamma', { secret: 'do-not-log' }, 503),
    }),
    /^Error: HTTP 503$/,
  );
});

test('rejects non-JSON health responses', async () => {
  await assert.rejects(
    checkLaneHealthOnce({
      target: laneHealthTargets[2],
      fetchImpl: async () => new Response('<html>not health</html>', { status: 200 }),
    }),
    /health endpoint returned non-JSON/,
  );
});

test('retries transient failures and returns once the lane becomes healthy', async () => {
  let calls = 0;
  let sleeps = 0;
  const [result] = await verifyLaneHealthTargets({
    targets: [laneHealthTargets[0]],
    attempts: 3,
    delayMs: 1,
    log: () => {},
    sleep: async () => { sleeps += 1; },
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('temporary DNS failure');
      return healthResponse('dru');
    },
  });

  assert.equal(result.environment, 'dru');
  assert.equal(calls, 2);
  assert.equal(sleeps, 1);
});
