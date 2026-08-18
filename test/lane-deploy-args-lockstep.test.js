import test from 'node:test';
import assert from 'node:assert/strict';
import { laneDeployArgs } from '../scripts/deploy-lane.mjs';

test('laneDeployArgs includes --env and optional full SHA tag', () => {
  const sha = 'a'.repeat(40);
  const args = laneDeployArgs('gamma', {
    FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1',
    GITHUB_SHA: sha,
  });
  assert.deepEqual(args.slice(0, 4), ['wrangler', 'deploy', '--env', 'gamma']);
  assert.ok(args.includes('--tag'));
  assert.ok(args.includes(sha));
  assert.ok(args.includes(`git:${sha}`));
});

test('laneDeployArgs omits tag without full SHA', () => {
  const args = laneDeployArgs('dru', { FREMONT_ALLOW_LANE_DEPLOY_FROM_MAIN: '1' });
  assert.equal(args.includes('--tag'), false);
});
