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

test('Workers Builds production deploy tags the Worker version with the exact Git SHA', () => {
  const args = productionDeployArgs({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
    WORKERS_CI_COMMIT_SHA: commitSha,
  });
  assert.equal(args[0], 'wrangler');
  assert.equal(args[1], 'deploy');
  assert.ok(args.includes('--tag'));
  assert.ok(args.includes(commitSha));
});

test('Workers Builds production deploy rejects a pull-request branch', () => {
  assert.throws(
    () => assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'feature/example',
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
