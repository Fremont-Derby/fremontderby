import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_LABELS } from '../scripts/collaboration-labels.mjs';

test('REQUIRED_LABELS includes agent lanes', () => {
  for (const name of ['agent:unclaimed', 'agent:jfl', 'agent:dru']) {
    assert.ok(REQUIRED_LABELS.includes(name), name);
  }
});

test('REQUIRED_LABELS includes full stage lifecycle', () => {
  for (const name of [
    'stage:ready',
    'stage:claimed',
    'stage:in-progress',
    'stage:handoff',
    'stage:merge-ready',
    'stage:merged',
    'stage:verified',
    'stage:closed',
  ]) {
    assert.ok(REQUIRED_LABELS.includes(name), name);
  }
});

test('REQUIRED_LABELS includes handoff and priority labels', () => {
  for (const name of ['handoff:jfl', 'handoff:dru', 'handoff:review', 'priority:p0', 'priority:p1']) {
    assert.ok(REQUIRED_LABELS.includes(name), name);
  }
});
