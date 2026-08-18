import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_LABELS } from '../scripts/collaboration-labels.mjs';

test('REQUIRED_LABELS includes agent and stage lanes', () => {
  assert.ok(REQUIRED_LABELS.includes('agent:dru'));
  assert.ok(REQUIRED_LABELS.includes('agent:jfl'));
  assert.ok(REQUIRED_LABELS.includes('agent:unclaimed'));
  assert.ok(REQUIRED_LABELS.includes('stage:handoff'));
  assert.ok(REQUIRED_LABELS.includes('stage:merge-ready'));
  assert.ok(REQUIRED_LABELS.includes('stage:verified'));
});

test('REQUIRED_LABELS includes handoff and human-required', () => {
  assert.ok(REQUIRED_LABELS.includes('handoff:dru'));
  assert.ok(REQUIRED_LABELS.includes('handoff:jfl'));
  assert.ok(REQUIRED_LABELS.includes('handoff:review'));
  assert.ok(REQUIRED_LABELS.includes('human-required'));
  assert.ok(REQUIRED_LABELS.includes('collision-risk'));
});
