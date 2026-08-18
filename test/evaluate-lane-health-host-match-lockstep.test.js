import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLaneHealthBody } from '../scripts/assert-lane-health.mjs';

test('evaluateLaneHealthBody fails when hostMatchesEnvironment is false', () => {
  const result = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ environment: 'dru', ok: true, hostMatchesEnvironment: false }),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /hostMatchesEnvironment=false/);
});

test('evaluateLaneHealthBody succeeds when environment matches and host matches', () => {
  const result = evaluateLaneHealthBody(
    'jfl.fremontderby.com',
    'jfl',
    200,
    JSON.stringify({ environment: 'jfl', ok: true, hostMatchesEnvironment: true }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.environment, 'jfl');
});
