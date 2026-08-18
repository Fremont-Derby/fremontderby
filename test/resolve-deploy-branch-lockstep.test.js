import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDeployBranch } from '../scripts/deploy-lane.mjs';

test('resolveDeployBranch prefers GITHUB_REF_NAME under Actions', () => {
  assert.equal(
    resolveDeployBranch({ GITHUB_ACTIONS: 'true', GITHUB_REF_NAME: 'fremontderby-dru' }),
    'fremontderby-dru',
  );
});

test('resolveDeployBranch prefers WORKERS_CI_BRANCH under Workers Builds', () => {
  assert.equal(
    resolveDeployBranch({ WORKERS_CI: '1', WORKERS_CI_BRANCH: 'fremontderby-jfl' }),
    'fremontderby-jfl',
  );
});

test('resolveDeployBranch falls back to git spawn outside CI', () => {
  const spawn = () => ({ status: 0, stdout: 'fremontderby-gamma\n', error: null });
  assert.equal(resolveDeployBranch({}, spawn), 'fremontderby-gamma');
});
