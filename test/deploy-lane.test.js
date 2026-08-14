import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertLaneDeployContext,
  laneDeployArgs,
  laneDeployments,
} from '../scripts/deploy-lane.mjs';

for (const lane of ['beta-jfl', 'beta-dru', 'gamma']) {
  test(`${lane} deploy maps only to its matching branch and Wrangler environment`, () => {
    const env = { GITHUB_ACTIONS: 'true', GITHUB_REF_NAME: lane };
    assert.deepEqual(assertLaneDeployContext(lane, env), laneDeployments[lane]);
    assert.deepEqual(laneDeployArgs(lane, env), ['wrangler', 'deploy', '--env', lane]);
  });
}

test('lane deploy refuses branch/environment mismatches', () => {
  assert.throws(
    () => assertLaneDeployContext('gamma', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'beta-jfl',
    }),
    /Refusing gamma deploy from branch "beta-jfl"; expected "gamma"/,
  );
});

test('lane deploy refuses unknown environments', () => {
  assert.throws(
    () => assertLaneDeployContext('production', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'main',
    }),
    /Unknown release lane/,
  );
});

test('GitHub deploys tag the Worker version with the exact commit SHA', () => {
  const sha = 'a'.repeat(40);
  const args = laneDeployArgs('gamma', {
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'gamma',
    GITHUB_SHA: sha,
  });
  assert.deepEqual(args, [
    'wrangler', 'deploy', '--env', 'gamma',
    '--tag', sha,
    '--message', `git:${sha}`,
  ]);
});
