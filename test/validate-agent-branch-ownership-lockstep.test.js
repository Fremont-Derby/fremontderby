import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgentBranchOwnership } from '../scripts/check-pr-card-contract.mjs';

function bodyWithOwner(owner) {
  return `## Owner lane / agent\n\n${owner}\n`;
}

test('DRU owner requires dru/* branch', () => {
  assert.deepEqual(validateAgentBranchOwnership(bodyWithOwner('DRU'), 'dru/issue-1-x'), []);
  assert.ok(validateAgentBranchOwnership(bodyWithOwner('DRU'), 'jfl/issue-1-x').length > 0);
});

test('jfl/* branch requires JFL owner', () => {
  assert.ok(validateAgentBranchOwnership(bodyWithOwner('DRU'), 'jfl/issue-1-x').length > 0);
  assert.deepEqual(validateAgentBranchOwnership(bodyWithOwner('JFL'), 'jfl/issue-1-x'), []);
});
