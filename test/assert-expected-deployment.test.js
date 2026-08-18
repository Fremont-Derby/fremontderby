import test from 'node:test';
import assert from 'node:assert/strict';
import { assertExpectedDeployment } from '../scripts/smoke-release.mjs';

const tag = 'a'.repeat(40);

test('assertExpectedDeployment waits when versionTag is untagged', () => {
  const result = assertExpectedDeployment({
    health: { service: 'fremontderby', ok: true, versionTag: null },
    environment: {
      service: 'fremontderby',
      environment: 'production',
      ok: true,
      versionTag: null,
    },
    expectedEnvironment: 'production',
    expectedVersionTag: tag,
  });
  assert.equal(result.ready, false);
  assert.match(result.reason, /currently untagged/);
});

test('assertExpectedDeployment is ready when tags and environment match', () => {
  const result = assertExpectedDeployment({
    health: { service: 'fremontderby', ok: true, versionTag: tag },
    environment: {
      service: 'fremontderby',
      environment: 'production',
      ok: true,
      versionTag: tag,
    },
    expectedEnvironment: 'production',
    expectedVersionTag: tag,
  });
  assert.equal(result.ready, true);
});

test('assertExpectedDeployment throws on environment mismatch', () => {
  assert.throws(
    () =>
      assertExpectedDeployment({
        health: { service: 'fremontderby', ok: true, versionTag: tag },
        environment: {
          service: 'fremontderby',
          environment: 'staging',
          ok: true,
          versionTag: tag,
        },
        expectedEnvironment: 'production',
        expectedVersionTag: tag,
      }),
    /environment mismatch/i,
  );
});
