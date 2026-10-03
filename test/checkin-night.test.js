import test from 'node:test';
import assert from 'node:assert/strict';
import { checkinNightLabel } from '../src/checkinNight.js';

test('a check-in night names the date and status', () => {
  assert.equal(checkinNightLabel({ date: '2026-10-03', status: 'in' }), '2026-10-03 · in');
  assert.equal(checkinNightLabel({}).includes('Date TBD'), true);
});
