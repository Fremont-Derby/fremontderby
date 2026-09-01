import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LANE_HEALTH_CHECKS,
  assertAllLaneHealth,
  evaluateLaneHealthBody,
} from '../scripts/assert-lane-health.mjs';
import { HOST_ENVIRONMENT_EXPECTATIONS } from '../src/hostEnvironment.js';

test('lane health checklist is derived 1:1 from HOST_ENVIRONMENT_EXPECTATIONS', () => {
  assert.equal(LANE_HEALTH_CHECKS.length, Object.keys(HOST_ENVIRONMENT_EXPECTATIONS).length);
  for (const check of LANE_HEALTH_CHECKS) {
    assert.equal(check.expect, HOST_ENVIRONMENT_EXPECTATIONS[check.host]);
  }
  const hosts = LANE_HEALTH_CHECKS.map((row) => row.host);
  assert.ok(hosts.includes('dru.fremontderby.com'));
  assert.ok(hosts.includes('jfl.fremontderby.com'));
  assert.ok(hosts.includes('gamma.fremontderby.com'));
  assert.ok(hosts.includes('fremontderby.com'));
  assert.ok(hosts.includes('www.fremontderby.com'));
});

test('evaluateLaneHealthBody accepts matching environment identity', () => {
  const result = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'dru' }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.environment, 'dru');
});

test('evaluateLaneHealthBody fails when DNS host reports production on a lane', () => {
  const result = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'production' }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /environment="production" expected="dru"/);
});

test('evaluateLaneHealthBody fails when hostMatchesEnvironment is false', () => {
  const result = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'dru', hostMatchesEnvironment: false }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /hostMatchesEnvironment=false/);
});

test('evaluateLaneHealthBody fails on non-JSON and non-2xx', () => {
  assert.equal(evaluateLaneHealthBody('x', 'x', 200, '<html>nope</html>').ok, false);
  assert.equal(
    evaluateLaneHealthBody('x', 'x', 503, JSON.stringify({ ok: false, environment: 'x' })).ok,
    false,
  );
});

test('assertAllLaneHealth aggregates probe failures without throwing', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('dru.')) {
      return {
        status: 200,
        text: async () => JSON.stringify({ ok: true, environment: 'production' }),
      };
    }
    if (url.includes('jfl.')) {
      return {
        status: 200,
        text: async () => JSON.stringify({ ok: true, environment: 'jfl' }),
      };
    }
    if (url.includes('gamma.')) {
      return {
        status: 200,
        text: async () => JSON.stringify({ ok: true, environment: 'gamma' }),
      };
    }
    return {
      status: 200,
      text: async () => JSON.stringify({ ok: true, environment: 'production' }),
    };
  };
  const summary = await assertAllLaneHealth(undefined, fetchImpl);
  assert.equal(summary.ok, false);
  assert.ok(summary.failed.some((row) => row.host === 'dru.fremontderby.com'));
});
