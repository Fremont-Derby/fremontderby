import assert from 'node:assert/strict';
import test from 'node:test';
import { readySlotConfirmBody } from '../src/druPublishPrep.js';

test('a ready practice slot is confirmed before publish', () => {
  const body = readySlotConfirmBody('2026-10-07T00:00:00.000Z');
  assert.equal(body.status, 'confirmed');
  assert.equal(body.resolved_at, '2026-10-07T00:00:00.000Z');
  assert.equal(body.last_action_reason, 'DRU practice night');
});

import { practicePublishTeamIds } from '../src/druPublishPrep.js';

test('eight open slots publish even when none are confirmed yet', () => {
  const slots = Array.from({ length: 8 }, (_, index) => ({ teamId: 'team-' + index, status: 'ready' }));
  const ids = practicePublishTeamIds([], slots);
  assert.equal(ids.length, 8);
  assert.equal(ids[0], 'team-0');
});
