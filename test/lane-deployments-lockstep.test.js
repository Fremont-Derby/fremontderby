import test from 'node:test';
import assert from 'node:assert/strict';
import { laneDeployments, expectedHostnamesForLane } from '../scripts/deploy-lane.mjs';

test('laneDeployments is frozen and maps three lanes', () => {
  assert.equal(Object.isFrozen(laneDeployments), true);
  assert.deepEqual(Object.keys(laneDeployments).sort(), ['dru', 'gamma', 'jfl']);
});

test('laneDeployments branch and environment lockstep', () => {
  assert.equal(laneDeployments.jfl.branch, 'fremontderby-jfl');
  assert.equal(laneDeployments.jfl.environment, 'jfl');
  assert.equal(laneDeployments.dru.branch, 'fremontderby-dru');
  assert.equal(laneDeployments.dru.environment, 'dru');
  assert.equal(laneDeployments.gamma.branch, 'fremontderby-gamma');
  assert.equal(laneDeployments.gamma.environment, 'gamma');
});

test('expectedHostnamesForLane returns lane custom domains', () => {
  assert.deepEqual(expectedHostnamesForLane('dru'), ['dru.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('jfl'), ['jfl.fremontderby.com']);
  assert.deepEqual(expectedHostnamesForLane('gamma'), ['gamma.fremontderby.com']);
});
