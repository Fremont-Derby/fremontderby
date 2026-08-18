import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTrackingCardLabels } from '../scripts/check-pr-card-contract.mjs';

test('validateTrackingCardLabels accepts merge-ready owned card', () => {
  const errors = validateTrackingCardLabels([
    'agent:dru',
    'stage:merge-ready',
    'priority:p1',
    'area:platform',
  ]);
  assert.deepEqual(errors, []);
});

test('validateTrackingCardLabels rejects unclaimed and wrong stage', () => {
  const errors = validateTrackingCardLabels([
    'agent:unclaimed',
    'stage:ready',
    'priority:p1',
    'area:platform',
  ]);
  assert.ok(errors.some((e) => /agent:unclaimed/.test(e)));
  assert.ok(errors.some((e) => /stage:handoff or stage:merge-ready/.test(e)));
});
