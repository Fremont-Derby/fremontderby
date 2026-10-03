import test from 'node:test';
import assert from 'node:assert/strict';
import { checkinRow } from '../src/checkinRow.js';

test('a check-in row names the date and status', () => {
  assert.equal(checkinRow({ date: '2026-10-03', status: 'in' }), '2026-10-03 · in');
});
