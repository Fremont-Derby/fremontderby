import test from 'node:test';
import assert from 'node:assert/strict';
import { laneDeployments } from '../scripts/deploy-lane.mjs';

test('laneDeployments maps permanent lanes to branches and envs', () => {
  assert.equal(Object.isFrozen(laneDeployments), true);
  assert.equal(laneDeployments.jfl.branch, 'fremontderby-jfl');
  assert.equal(laneDeployments.jfl.environment, 'jfl');
  assert.equal(laneDeployments.dru.branch, 'fremontderby-dru');
  assert.equal(laneDeployments.dru.environment, 'dru');
  assert.equal(laneDeployments.gamma.branch, 'fremontderby-gamma');
  assert.equal(laneDeployments.gamma.environment, 'gamma');
});
