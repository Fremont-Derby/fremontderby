import test from 'node:test';
import assert from 'node:assert/strict';
import { branchAllowedForLane } from '../scripts/guard-cloudflare-build.mjs';

test('branchAllowedForLane accepts permanent lane branches and refuses PR/bots', () => {
  assert.equal(branchAllowedForLane('main', 'production'), true);
  assert.equal(branchAllowedForLane('fremontderby-dru', 'dru'), true);
  assert.equal(branchAllowedForLane('dru/issue-9-x', 'dru'), true);
  assert.equal(branchAllowedForLane('jfl/issue-1', 'dru'), false);
  assert.equal(branchAllowedForLane('pull/12/head', 'production'), false);
  assert.equal(branchAllowedForLane('dependabot/npm_and_yarn/x', 'jfl'), false);
  assert.equal(branchAllowedForLane('renovate/something', 'gamma'), false);
});
