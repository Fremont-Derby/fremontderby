import test from 'node:test';
import assert from 'node:assert/strict';
import { laneDeployArgs, resolveDeploySha } from '../scripts/deploy-lane.mjs';

const full = 'a'.repeat(40);
const other = 'b'.repeat(40);

test('resolveDeploySha prefers GITHUB_SHA over WORKERS_CI_COMMIT_SHA', () => {
  assert.equal(
    resolveDeploySha({ GITHUB_SHA: full, WORKERS_CI_COMMIT_SHA: other }),
    full,
  );
});

test('resolveDeploySha uses WORKERS_CI_COMMIT_SHA when GITHUB_SHA absent', () => {
  assert.equal(resolveDeploySha({ WORKERS_CI_COMMIT_SHA: other }), other);
});

test('resolveDeploySha rejects short or empty values', () => {
  assert.equal(resolveDeploySha({ GITHUB_SHA: 'abc1234' }), '');
  assert.equal(resolveDeploySha({}), '');
});

test('laneDeployArgs tags from WORKERS_CI_COMMIT_SHA', () => {
  const args = laneDeployArgs('dru', {
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'fremontderby-dru',
    WORKERS_CI_COMMIT_SHA: full,
  });
  assert.deepEqual(args, [
    'wrangler', 'deploy', '--env', 'dru',
    '--tag', full,
    '--message', `git:${full}`,
  ]);
});
