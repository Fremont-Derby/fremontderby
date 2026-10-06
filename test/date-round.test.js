import test from 'node:test';
import assert from 'node:assert/strict';
import { roundsForDate } from '../src/dateRound.js';

test('a date filter does not show another night', () => {
  const rounds = roundsForDate([{ scheduledOn: '2026-10-07' }, { scheduledOn: '2026-10-08' }], '2026-10-08');
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].scheduledOn, '2026-10-08');
});
