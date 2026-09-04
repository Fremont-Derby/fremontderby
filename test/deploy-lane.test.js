import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertLaneDeployContext,
  laneDeployArgs,
  laneDeployments,
} from '../scripts/deploy-lane.mjs';

for (const lane of ['jfl', 'dru', 'gamma']) {
  test(`${lane} deploy maps only to its matching Fremont Derby branch and Wrangler environment`, () => {
    const env = { GITHUB_ACTIONS: 'true', GITHUB_REF_NAME: `fremontderby-${lane}` };
    assert.deepEqual(assertLaneDeployContext(lane, env), laneDeployments[lane]);
    assert.deepEqual(laneDeployArgs(lane, env), ['wrangler', 'deploy', '--env', lane]);
  });
}

test('lane deploy refuses branch/environment mismatches', () => {
  assert.throws(
    () => assertLaneDeployContext('gamma', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'fremontderby-jfl',
    }),
    /Refusing gamma deploy from branch "fremontderby-jfl"; expected "fremontderby-gamma"/,
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
    GITHUB_REF_NAME: 'fremontderby-gamma',
    GITHUB_SHA: sha,
  });
  assert.deepEqual(args, [
    'wrangler', 'deploy', '--env', 'gamma',
    '--tag', sha,
    '--message', `git:${sha}`,
  ]);
});

test('Actions may deploy a lane from main only with explicit allow flag', () => {
  // CI stays fail-closed even when the local recovery flag is set.
  assert.throws(
    () => assertLaneDeployContext('dru', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'main',
      FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1',
    }),
    /Refusing dru deploy from branch "main"/,
  );
  assert.throws(
    () => assertLaneDeployContext('dru', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'main',
    }),
    /Refusing dru deploy from branch "main"/,
  );
});
