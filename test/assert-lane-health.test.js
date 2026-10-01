import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LANE_HEALTH_CHECKS,
  assertAllLaneHealth,
  evaluateLaneHealthBody,
} from '../scripts/assert-lane-health.mjs';

test('lane health checklist covers dru, jfl, gamma, production apex, and www', () => {
  assert.deepEqual(
    LANE_HEALTH_CHECKS.map((row) => [row.host, row.expect]),
    [
      ['dru.fremontderby.com', 'dru'],
      ['jfl.fremontderby.com', 'jfl'],
      ['gamma.fremontderby.com', 'gamma'],
      ['fremontderby.com', 'production'],
      ['www.fremontderby.com', 'production'],
    ],
  );
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
  assert.equal(summary.failed.length, 1);
  assert.equal(summary.failed[0].host, 'dru.fremontderby.com');
});
