import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertLaneDeployContext,
  laneDeployArgs,
  laneDeployments,
  resolveDeploySha,
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

test('GitHub deploys tag the Worker version with the exact commit SHA and DEPLOY_GIT_SHA var', () => {
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
    '--var', `DEPLOY_GIT_SHA:${sha}`,
  ]);
});

test('Workers Builds tags from WORKERS_CI_COMMIT_SHA when GITHUB_SHA is absent', () => {
  const sha = 'b'.repeat(40);
  const args = laneDeployArgs('dru', {
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'fremontderby-dru',
    WORKERS_CI_COMMIT_SHA: sha,
  });
  assert.deepEqual(args, [
    'wrangler', 'deploy', '--env', 'dru',
    '--tag', sha,
    '--message', `git:${sha}`,
    '--var', `DEPLOY_GIT_SHA:${sha}`,
  ]);
});

test('GITHUB_SHA is preferred when both SHA sources are present', () => {
  const github = 'c'.repeat(40);
  const workers = 'd'.repeat(40);
  assert.equal(resolveDeploySha({
    GITHUB_SHA: github,
    WORKERS_CI_COMMIT_SHA: workers,
  }), github);
});

test('non-hex or short values are rejected by resolveDeploySha', () => {
  assert.equal(resolveDeploySha({ GITHUB_SHA: 'not-a-sha' }), '');
  assert.equal(resolveDeploySha({ WORKERS_CI_COMMIT_SHA: 'abc' }), '');
  assert.equal(resolveDeploySha({}), '');
});

test('Actions may deploy a lane from main only with explicit allow flag', () => {
  assert.deepEqual(
    assertLaneDeployContext('dru', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'main',
      FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1',
    }),
    laneDeployments.dru,
  );
  assert.throws(
    () => assertLaneDeployContext('dru', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'main',
    }),
    /Refusing dru deploy from branch "main"/,
  );
});
