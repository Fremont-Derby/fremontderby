import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLOBAL_REFUSE_BRANCH_PATTERNS,
  branchAllowedForLane,
} from '../scripts/guard-cloudflare-build.mjs';

test('GLOBAL_REFUSE_BRANCH_PATTERNS is frozen', () => {
  assert.equal(Object.isFrozen(GLOBAL_REFUSE_BRANCH_PATTERNS), true);
  assert.ok(GLOBAL_REFUSE_BRANCH_PATTERNS.length >= 3);
});

test('branchAllowedForLane refuses PR and bot branches on all lanes', () => {
  for (const lane of ['production', 'jfl', 'dru', 'gamma']) {
    assert.equal(branchAllowedForLane('pull/12/head', lane), false);
    assert.equal(branchAllowedForLane('pull/12/merge', lane), false);
    assert.equal(branchAllowedForLane('dependabot/npm_and_yarn/x', lane), false);
    assert.equal(branchAllowedForLane('renovate/something', lane), false);
  }
});
