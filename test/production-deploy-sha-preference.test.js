import test from 'node:test';
import assert from 'node:assert/strict';
import { productionDeployArgs } from '../scripts/deploy-production.mjs';

const workersSha = 'b'.repeat(40);
const githubSha = 'a'.repeat(40);
const deploySha = 'c'.repeat(40);

test('productionDeployArgs prefers WORKERS_CI_COMMIT_SHA over GITHUB_SHA', () => {
  const args = productionDeployArgs({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'main',
    WORKERS_CI_COMMIT_SHA: workersSha,
    GITHUB_SHA: githubSha,
  });
  assert.ok(args.includes(workersSha));
  assert.ok(!args.includes(githubSha));
  assert.ok(args.includes(`DEPLOY_GIT_SHA:${workersSha}`));
});

test('productionDeployArgs uses GITHUB_SHA when Workers CI sha absent', () => {
  const args = productionDeployArgs({ GITHUB_SHA: githubSha });
  assert.deepEqual(args, [
    'wrangler',
    'deploy',
    '--tag',
    githubSha,
    '--message',
    `git:${githubSha}`,
    '--var',
    `DEPLOY_GIT_SHA:${githubSha}`,
  ]);
});

test('productionDeployArgs uses DEPLOY_GIT_SHA as last resort', () => {
  const args = productionDeployArgs({ DEPLOY_GIT_SHA: deploySha });
  assert.ok(args.includes(`DEPLOY_GIT_SHA:${deploySha}`));
  assert.ok(args.includes('--tag') && args.includes(deploySha));
});
