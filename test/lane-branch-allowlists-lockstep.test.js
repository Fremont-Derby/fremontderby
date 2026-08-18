import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANE_BRANCH_ALLOWLISTS,
  branchAllowedForLane,
} from '../scripts/guard-cloudflare-build.mjs';

test('LANE_BRANCH_ALLOWLISTS has production jfl dru gamma', () => {
  assert.deepEqual(Object.keys(LANE_BRANCH_ALLOWLISTS).sort(), ['dru', 'gamma', 'jfl', 'production']);
});

test('branchAllowedForLane accepts permanent lane branches', () => {
  assert.equal(branchAllowedForLane('main', 'production'), true);
  assert.equal(branchAllowedForLane('fremontderby-jfl', 'jfl'), true);
  assert.equal(branchAllowedForLane('fremontderby-dru', 'dru'), true);
  assert.equal(branchAllowedForLane('fremontderby-gamma', 'gamma'), true);
  assert.equal(branchAllowedForLane('dru/issue-1-x', 'dru'), true);
  assert.equal(branchAllowedForLane('jfl/issue-1-x', 'jfl'), true);
});

test('branchAllowedForLane rejects cross-lane branches', () => {
  assert.equal(branchAllowedForLane('fremontderby-jfl', 'dru'), false);
  assert.equal(branchAllowedForLane('dru/issue-1-x', 'production'), false);
  assert.equal(branchAllowedForLane('feature/foo', 'jfl'), false);
});
