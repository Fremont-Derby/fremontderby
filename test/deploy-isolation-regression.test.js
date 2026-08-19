import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLaneDeployContext, laneDeployArgs } from '../scripts/deploy-lane.mjs';
import { assertProductionDeployContext, productionDeployArgs } from '../scripts/deploy-production.mjs';

const sha = 'a'.repeat(40);

test('GitHub Actions cannot bypass a JFL branch/lane mismatch with the legacy override', () => {
  assert.throws(
    () => assertLaneDeployContext('dru', {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: 'fremontderby-jfl',
      FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1',
    }),
    /Refusing dru deploy from branch "fremontderby-jfl"; expected "fremontderby-dru"/,
  );
});

test('Workers Builds cannot bypass a lane mismatch with the legacy local override', () => {
  assert.throws(
    () => assertLaneDeployContext('jfl', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'fremontderby-dru',
      FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1',
    }),
    /Refusing jfl deploy from branch "fremontderby-dru"; expected "fremontderby-jfl"/,
  );
});

test('GitHub Actions production deploy is allowed only from main', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: sha,
  }));
  assert.deepEqual(productionDeployArgs({
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: sha,
  }), [
    'wrangler', 'deploy',
    '--tag', sha,
    '--message', `git:${sha}`,
    '--var', `DEPLOY_GIT_SHA:${sha}`,
  ]);

  for (const branch of ['fremontderby-jfl', 'fremontderby-dru', 'fremontderby-gamma']) {
    assert.throws(
      () => assertProductionDeployContext({
        GITHUB_ACTIONS: 'true',
        GITHUB_REF_NAME: branch,
        GITHUB_SHA: sha,
      }),
      /expected "main"/,
    );
  }
});

test('GitHub Actions production deploy fails closed without ref metadata', () => {
  assert.throws(
    () => assertProductionDeployContext({ GITHUB_ACTIONS: 'true', GITHUB_SHA: sha }),
    /GITHUB_REF_NAME/,
  );
});

test('productionDeployArgs prefers WORKERS_CI then GITHUB_SHA then DEPLOY_GIT_SHA and always sets health var', () => {
  const fromWorkers = productionDeployArgs({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
    WORKERS_CI_COMMIT_SHA: sha,
    GITHUB_SHA: 'b'.repeat(40),
  });
  assert.ok(fromWorkers.includes('--tag'));
  assert.ok(fromWorkers.includes(sha));
  assert.ok(fromWorkers.includes(`DEPLOY_GIT_SHA:${sha}`));
  assert.equal(fromWorkers.includes('b'.repeat(40)), false);

  const fromGithub = productionDeployArgs({
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: sha,
  });
  assert.ok(fromGithub.includes(`DEPLOY_GIT_SHA:${sha}`));

  const fromDeploy = productionDeployArgs({ DEPLOY_GIT_SHA: sha });
  assert.ok(fromDeploy.includes(`DEPLOY_GIT_SHA:${sha}`));
});

test('laneDeployArgs sets DEPLOY_GIT_SHA health var for matching permanent branches', () => {
  for (const [lane, branch] of [
    ['jfl', 'fremontderby-jfl'],
    ['dru', 'fremontderby-dru'],
    ['gamma', 'fremontderby-gamma'],
  ]) {
    const args = laneDeployArgs(lane, {
      GITHUB_ACTIONS: 'true',
      GITHUB_REF_NAME: branch,
      GITHUB_SHA: sha,
    });
    assert.ok(args.includes('--env'));
    assert.ok(args.includes(lane));
    assert.ok(args.includes('--tag'));
    assert.ok(args.includes(`DEPLOY_GIT_SHA:${sha}`));
  }
});
