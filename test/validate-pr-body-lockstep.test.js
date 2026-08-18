import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePullRequestBody } from '../scripts/check-pr-card-contract.mjs';

function validBody() {
  return [
    '## Tracking card',
    '',
    'Tracks #1193',
    '',
    '## Owner lane / agent',
    '',
    'DRU',
    '',
    '## Touched surfaces',
    '',
    'tests',
    '',
    '## Out of scope',
    '',
    'deploys',
    '',
    '## Proof',
    '',
    'unit tests',
    '',
    '## Handoff',
    '',
    'none',
  ].join('\n');
}

test('validatePullRequestBody accepts a complete DRU body', () => {
  assert.deepEqual(
    validatePullRequestBody(validBody(), 'Fremont-Derby/fremontderby', 'dru/issue-1193-x'),
    [],
  );
});

test('validatePullRequestBody rejects auto-close keywords', () => {
  const body = validBody() + '\n\nCloses #1193\n';
  const errors = validatePullRequestBody(body, 'Fremont-Derby/fremontderby', 'dru/issue-1193-x');
  assert.ok(errors.some((e) => /Automatic close keywords/.test(e)));
});
