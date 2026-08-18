import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertProductionDeployContext,
  productionDeployArgs,
} from '../scripts/deploy-production.mjs';

test('assertProductionDeployContext is no-op outside WORKERS_CI', () => {
  assert.doesNotThrow(() => assertProductionDeployContext({}));
});

test('assertProductionDeployContext requires main and full SHA under WORKERS_CI', () => {
  assert.throws(
    () =>
      assertProductionDeployContext({
        WORKERS_CI: '1',
        WORKERS_CI_BRANCH: 'feature',
        WORKERS_CI_COMMIT_SHA: 'a'.repeat(40),
      }),
    /non-production branch/,
  );
  assert.doesNotThrow(() =>
    assertProductionDeployContext({
      WORKERS_CI: '1',
      WORKERS_CI_BRANCH: 'main',
      WORKERS_CI_COMMIT_SHA: 'b'.repeat(40),
    }),
  );
});

test('productionDeployArgs tags full SHA and sets DEPLOY_GIT_SHA var', () => {
  const sha = 'c'.repeat(40);
  const args = productionDeployArgs({ GITHUB_SHA: sha });
  assert.deepEqual(args.slice(0, 2), ['wrangler', 'deploy']);
  assert.ok(args.includes('--tag'));
  assert.ok(args.includes(sha));
  assert.ok(args.includes('--var'));
  assert.ok(args.includes(`DEPLOY_GIT_SHA:${sha}`));
  assert.equal(args.includes('--env'), false);
});
