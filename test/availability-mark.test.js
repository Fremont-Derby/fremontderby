import test from 'node:test';
import assert from 'node:assert/strict';
import { availabilityMark } from '../src/availabilityMark.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('an availability mark names the status and date', () => {
  assert.equal(availabilityMark({ date: '2026-10-03', status: 'in' }), 'Checked in as in for 2026-10-03.');
  assert.equal(availabilityMark({}), '');
  assert.doesNotMatch(renderAvailabilityPage(), /Checked in as in for 2026-10-03/);
});
