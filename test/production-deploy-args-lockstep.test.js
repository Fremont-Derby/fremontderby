import test from 'node:test';
import assert from 'node:assert/strict';
import { productionDeployArgs } from '../scripts/deploy-production.mjs';

test('productionDeployArgs includes --tag and DEPLOY_GIT_SHA when SHA present', () => {
  const sha = 'b'.repeat(40);
  const args = productionDeployArgs({ GITHUB_SHA: sha });
  assert.ok(args.includes('wrangler'));
  assert.ok(args.includes('deploy'));
  assert.ok(args.includes('--tag'));
  assert.ok(args.includes(sha));
  assert.ok(args.includes('--var'));
  assert.ok(args.includes(`DEPLOY_GIT_SHA:${sha}`));
});

test('productionDeployArgs works without SHA', () => {
  const args = productionDeployArgs({});
  assert.deepEqual(args.slice(0, 2), ['wrangler', 'deploy']);
  assert.equal(args.includes('--tag'), false);
});
