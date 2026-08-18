import test from 'node:test';
import assert from 'node:assert/strict';
import { LANE_HEALTH_CHECKS, evaluateLaneHealthBody } from '../scripts/assert-lane-health.mjs';

test('LANE_HEALTH_CHECKS is frozen and covers five public hosts', () => {
  assert.equal(Object.isFrozen(LANE_HEALTH_CHECKS), true);
  assert.equal(LANE_HEALTH_CHECKS.length, 5);
  const hosts = LANE_HEALTH_CHECKS.map((c) => c.host).sort();
  assert.deepEqual(hosts, [
    'dru.fremontderby.com',
    'fremontderby.com',
    'gamma.fremontderby.com',
    'jfl.fremontderby.com',
    'www.fremontderby.com',
  ]);
});

test('LANE_HEALTH_CHECKS expect values match HOST_ENVIRONMENT_EXPECTATIONS', () => {
  const byHost = Object.fromEntries(LANE_HEALTH_CHECKS.map((c) => [c.host, c.expect]));
  assert.equal(byHost['fremontderby.com'], 'production');
  assert.equal(byHost['www.fremontderby.com'], 'production');
  assert.equal(byHost['jfl.fremontderby.com'], 'jfl');
  assert.equal(byHost['dru.fremontderby.com'], 'dru');
  assert.equal(byHost['gamma.fremontderby.com'], 'gamma');
});

test('evaluateLaneHealthBody fails on environment mismatch', () => {
  const result = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ environment: 'production', ok: true }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /environment="production" expected="dru"/);
});
