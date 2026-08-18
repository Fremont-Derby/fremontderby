import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_LABELS } from '../scripts/collaboration-labels.mjs';

test('REQUIRED_LABELS includes agents stages priorities and handoffs', () => {
  for (const name of [
    'agent:unclaimed',
    'agent:dru',
    'agent:jfl',
    'stage:ready',
    'stage:merge-ready',
    'stage:verified',
    'priority:p0',
    'handoff:dru',
    'human-required',
    'blocked',
  ]) {
    assert.ok(REQUIRED_LABELS.includes(name), name);
  }
});
