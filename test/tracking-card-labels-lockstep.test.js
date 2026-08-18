import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTrackingCardLabels } from '../scripts/check-pr-card-contract.mjs';

test('validateTrackingCardLabels accepts handoff-ready set', () => {
  const errors = validateTrackingCardLabels([
    'agent:dru',
    'stage:handoff',
    'priority:p1',
    'area:infra',
    'handoff:review',
  ]);
  assert.deepEqual(errors, []);
});

test('validateTrackingCardLabels rejects unclaimed owner', () => {
  const errors = validateTrackingCardLabels([
    'agent:unclaimed',
    'stage:merge-ready',
    'priority:p1',
    'area:infra',
  ]);
  assert.ok(errors.some((e) => /agent:unclaimed/.test(e)));
});

test('validateTrackingCardLabels requires handoff target at stage:handoff', () => {
  const errors = validateTrackingCardLabels([
    'agent:dru',
    'stage:handoff',
    'priority:p1',
    'area:infra',
  ]);
  assert.ok(errors.some((e) => /handoff:\*/.test(e)));
});
