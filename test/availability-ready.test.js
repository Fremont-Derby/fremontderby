import test from 'node:test';
import assert from 'node:assert/strict';
import { availabilityReady } from '../src/availabilityReady.js';

test('a rostered player can set availability', () => {
  assert.equal(availabilityReady('player'), true);
  assert.equal(availabilityReady(''), false);
});
