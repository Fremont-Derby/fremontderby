import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertProductionDeployContext,
  productionDeployArgs,
} from '../scripts/deploy-production.mjs';

const commitSha = '0123456789abcdef0123456789abcdef01234567';

test('Workers Builds production deploy is allowed from main with full Git metadata', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
    WORKERS_CI_COMMIT_SHA: commitSha,
  }));
});

test('Workers Builds production deploy tags the Worker and exposes DEPLOY_GIT_SHA var', () => {
  // Intentional architecture: --tag/--message for CF version metadata, plus
  // --var DEPLOY_GIT_SHA so /health can report the exact SHA even when
  // CF_VERSION_METADATA.tag is empty.
  assert.deepEqual(
    productionDeployArgs({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }),
    [
      'wrangler', 'deploy',
      '--tag', commitSha,
      '--message', `git:${commitSha}`,
      '--var', `DEPLOY_GIT_SHA:${commitSha}`,
    ],
  );
});

test('Workers Builds production deploy rejects a non-main branch', () => {
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'feature/example',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }),
    /Refusing production deploy from non-production branch/,
  );
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'fremontderby-dru',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }),
    /Refusing production deploy from non-production branch/,
  );
});

test('Workers Builds production deploy fails closed when branch metadata is missing', () => {
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_COMMIT_SHA: commitSha,
    }),
    /did not provide WORKERS_CI_BRANCH/,
  );
});

test('Workers Builds production deploy fails closed when commit metadata is missing or malformed', () => {
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
    }),
    /did not provide WORKERS_CI_COMMIT_SHA/,
  );
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      WORKERS_CI_COMMIT_SHA: 'short-sha',
    }),
    /not a full Git SHA/,
  );
});

test('local/manual deploys remain allowed and untagged outside Workers Builds', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({}));
  assert.deepEqual(productionDeployArgs({}), ['wrangler', 'deploy']);
});

test('GITHUB_SHA / DEPLOY_GIT_SHA also drive production deploy tagging outside Workers CI', () => {
  const sha = 'abcdef0123456789abcdef0123456789abcdef01';
  assert.deepEqual(
    productionDeployArgs({ GITHUB_SHA: sha }),
    [
      'wrangler', 'deploy',
      '--tag', sha,
      '--message', `git:${sha}`,
      '--var', `DEPLOY_GIT_SHA:${sha}`,
    ],
  );
  assert.deepEqual(
    productionDeployArgs({ DEPLOY_GIT_SHA: sha }),
    [
      'wrangler', 'deploy',
      '--tag', sha,
      '--message', `git:${sha}`,
      '--var', `DEPLOY_GIT_SHA:${sha}`,
    ],
  );
});
