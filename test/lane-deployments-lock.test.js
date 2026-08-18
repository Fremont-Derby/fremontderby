import test from 'node:test';
import assert from 'node:assert/strict';
import { laneDeployments } from '../scripts/deploy-lane.mjs';

test('laneDeployments keys are the three release lanes', () => {
  assert.deepEqual(Object.keys(laneDeployments).sort(), ['dru', 'gamma', 'jfl']);
});

test('each lane maps to fremontderby-<lane> branch and matching environment', () => {
  for (const [lane, config] of Object.entries(laneDeployments)) {
    assert.equal(config.environment, lane);
    assert.equal(config.branch, `fremontderby-${lane}`);
  }
});
