import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractTrackingCardNumbers,
  validateAgentBranchOwnership,
  validatePullRequestBody,
} from '../scripts/check-pr-card-contract.mjs';

test('extractTrackingCardNumbers finds Tracks #N', () => {
  const nums = extractTrackingCardNumbers('Tracks #1193\n\n## Owner lane / agent\nDRU');
  assert.deepEqual(nums, [1193]);
});

test('validateAgentBranchOwnership enforces dru/ for DRU owner', () => {
  const body = '## Owner lane / agent\nDRU pure-code\n';
  assert.equal(validateAgentBranchOwnership(body, 'dru/issue-1-foo').length, 0);
  assert.ok(validateAgentBranchOwnership(body, 'jfl/issue-1-foo').length > 0);
});

test('validatePullRequestBody rejects auto-close keywords', () => {
  const body = [
    '## Tracking card',
    'Tracks #1193',
    '',
    '## Owner lane / agent',
    'DRU',
    '',
    '## Touched surfaces',
    'test only',
    '',
    '## Out of scope',
    'none',
    '',
    '## Proof',
    'local green',
    '',
    '## Handoff',
    'Keep card open',
    '',
    'Closes #1193',
  ].join('\n');
  const errors = validatePullRequestBody(body, 'Fremont-Derby/fremontderby', 'dru/issue-1193-x');
  assert.ok(errors.some((e) => /Automatic close keywords are not allowed/i.test(e)));
});
