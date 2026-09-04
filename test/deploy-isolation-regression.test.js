import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLaneDeployContext } from '../scripts/deploy-lane.mjs';
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

test('GitHub Actions production deploy is allowed only from main and preserves health SHA', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: sha,
  }));
  assert.deepEqual(productionDeployArgs({
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: sha,
  }), ['wrangler', 'deploy', '--tag', sha, '--message', `git:${sha}`, '--var', `DEPLOY_GIT_SHA:${sha}`]);

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
