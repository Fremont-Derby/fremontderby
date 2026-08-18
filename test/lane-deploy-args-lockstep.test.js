import test from 'node:test';
import assert from 'node:assert/strict';
import { laneDeployArgs } from '../scripts/deploy-lane.mjs';

function fakeSpawn() {
  return () => ({ status: 0, stdout: 'fremontderby-dru', error: null });
}

test('laneDeployArgs includes --env for lane', () => {
  const args = laneDeployArgs('dru', {
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'fremontderby-dru',
  }, fakeSpawn());
  assert.ok(args.includes('wrangler'));
  assert.ok(args.includes('deploy'));
  assert.ok(args.includes('--env'));
  assert.ok(args.includes('dru'));
});

test('laneDeployArgs tags full GITHUB_SHA when present', () => {
  const sha = 'c'.repeat(40);
  const args = laneDeployArgs('dru', {
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'fremontderby-dru',
    GITHUB_SHA: sha,
  }, fakeSpawn());
  assert.ok(args.includes('--tag'));
  assert.ok(args.includes(sha));
  assert.ok(args.includes(`git:${sha}`));
});
