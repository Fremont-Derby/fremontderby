import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLaneHealthBody } from '../scripts/assert-lane-health.mjs';

test('evaluateLaneHealthBody fails on environment mismatch', () => {
  const result = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ environment: 'jfl', ok: true, hostMatchesEnvironment: true }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /environment="jfl" expected="dru"/);
});

test('evaluateLaneHealthBody succeeds for matching environment', () => {
  const result = evaluateLaneHealthBody(
    'gamma.fremontderby.com',
    'gamma',
    200,
    JSON.stringify({ environment: 'gamma', ok: true, hostMatchesEnvironment: true }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.environment, 'gamma');
});
