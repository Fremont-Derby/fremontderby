import test from 'node:test';
import assert from 'node:assert/strict';
import { availabilityChoiceLabel } from '../src/availabilityChoice.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('an availability choice names the date, round, role, and check-in status', () => {
  assert.equal(availabilityChoiceLabel({ date: '2026-10-03', round: 'Round 1', role: 'player', status: 'in' }), '2026-10-03 · Round 1 · player · in');
  assert.match(renderAvailabilityPage(), /2026-10-03 · Round 1 · player · in/);
});
