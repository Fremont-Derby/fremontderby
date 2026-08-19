import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertProductionDeployContext,
  productionDeployArgs,
} from '../scripts/deploy-production.mjs';
import {
  resolveDeployBranch,
  assertLaneDeployContext,
  laneDeployArgs,
  laneDeployments,
} from '../scripts/deploy-lane.mjs';

const FULL_SHA = 'a'.repeat(40);
const SHORT_SHA = 'abcdef1';

test('Workers CI production deploy requires main + full 40-char WORKERS_CI_COMMIT_SHA', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
    WORKERS_CI_COMMIT_SHA: FULL_SHA,
  }));
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'feature/x',
      WORKERS_CI_COMMIT_SHA: FULL_SHA,
    }),
    /non-production branch/,
  );
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      WORKERS_CI_COMMIT_SHA: SHORT_SHA,
    }),
    /not a full Git SHA/,
  );
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
    }),
    /WORKERS_CI_COMMIT_SHA/,
  );
});

test('productionDeployArgs prefers WORKERS_CI_COMMIT_SHA then GITHUB_SHA then DEPLOY_GIT_SHA', () => {
  const fromWorkers = productionDeployArgs({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
    WORKERS_CI_COMMIT_SHA: FULL_SHA,
    GITHUB_SHA: 'b'.repeat(40),
  });
  assert.ok(fromWorkers.includes('--tag'));
  assert.ok(fromWorkers.includes(FULL_SHA));
  assert.ok(fromWorkers.includes(`DEPLOY_GIT_SHA:${FULL_SHA}`));

  const fromGithub = productionDeployArgs({ GITHUB_SHA: FULL_SHA });
  assert.ok(fromGithub.includes(FULL_SHA));

  const fromDeploy = productionDeployArgs({ DEPLOY_GIT_SHA: FULL_SHA });
  assert.ok(fromDeploy.includes(FULL_SHA));
});

test('resolveDeployBranch uses WORKERS_CI_BRANCH when WORKERS_CI=1', () => {
  assert.equal(
    resolveDeployBranch({ WORKERS_CI: '1', WORKERS_CI_BRANCH: 'fremontderby-jfl' }),
    'fremontderby-jfl',
  );
  assert.throws(
    () => resolveDeployBranch({ WORKERS_CI: '1' }),
    /WORKERS_CI_BRANCH/,
  );
});

test('lane deploy under Workers CI requires matching permanent branch', () => {
  for (const lane of ['jfl', 'dru', 'gamma']) {
    const env = {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: laneDeployments[lane].branch,
      GITHUB_SHA: FULL_SHA,
    };
    assert.deepEqual(assertLaneDeployContext(lane, env), laneDeployments[lane]);
    const args = laneDeployArgs(lane, env);
    assert.deepEqual(args, [
      'wrangler', 'deploy', '--env', lane,
      '--tag', FULL_SHA,
      '--message', `git:${FULL_SHA}`,
    ]);
  }
  assert.throws(
    () => assertLaneDeployContext('jfl', {
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'fremontderby-dru',
    }),
    /Refusing jfl deploy/,
  );
});

test('lane deploy tags only full 40-char GITHUB_SHA (not short SHAs)', () => {
  const args = laneDeployArgs('gamma', {
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'fremontderby-gamma',
    GITHUB_SHA: SHORT_SHA,
  });
  assert.equal(args.includes('--tag'), false);
});
