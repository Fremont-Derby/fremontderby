import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLOBAL_REFUSE_BRANCH_PATTERNS,
  LANE_BRANCH_ALLOWLISTS,
  branchAllowedForLane,
} from '../scripts/guard-cloudflare-build.mjs';

test('LANE_BRANCH_ALLOWLISTS keys are the four build lanes', () => {
  assert.deepEqual(Object.keys(LANE_BRANCH_ALLOWLISTS).sort(), [
    'dru',
    'gamma',
    'jfl',
    'production',
  ]);
});

test('permanent branches are allowlisted for each non-production lane', () => {
  for (const lane of ['jfl', 'dru', 'gamma']) {
    assert.equal(branchAllowedForLane(`fremontderby-${lane}`, lane), true);
    assert.equal(branchAllowedForLane(`${lane}/issue-1-x`, lane), true);
    assert.equal(branchAllowedForLane('main', lane), false);
  }
  assert.equal(branchAllowedForLane('main', 'production'), true);
  assert.equal(branchAllowedForLane('fremontderby-jfl', 'production'), false);
});

test('GLOBAL_REFUSE_BRANCH_PATTERNS blocks PR and bot branches', () => {
  const samples = ['pull/12/head', 'pull/99/merge', 'dependabot/npm_and_yarn/x', 'renovate/lodash'];
  for (const branch of samples) {
    assert.ok(
      GLOBAL_REFUSE_BRANCH_PATTERNS.some((re) => re.test(branch)),
      branch,
    );
    for (const lane of Object.keys(LANE_BRANCH_ALLOWLISTS)) {
      assert.equal(branchAllowedForLane(branch, lane), false, `${branch} on ${lane}`);
    }
  }
});
