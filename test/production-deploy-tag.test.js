import test from 'node:test';
import assert from 'node:assert/strict';
import { productionDeployArgs } from '../scripts/deploy-production.mjs';

test('production deploy tags from GITHUB_SHA outside Workers CI', () => {
  const args = productionDeployArgs({
    GITHUB_SHA: 'c26d155c45c4b6376bd277903bc5ad395ec20f60',
  });
  assert.ok(args.includes('--env'));
  assert.equal(args[args.indexOf('--env') + 1], '');
  assert.ok(args.includes('--tag'));
  assert.ok(args.includes('c26d155c45c4b6376bd277903bc5ad395ec20f60'));
  assert.ok(args.includes('--var'));
  assert.ok(args.some((a) => String(a).startsWith('DEPLOY_GIT_SHA:')));
});

test('production deploy omits tag when no sha present', () => {
  const args = productionDeployArgs({});
  assert.equal(args.includes('--tag'), false);
});
