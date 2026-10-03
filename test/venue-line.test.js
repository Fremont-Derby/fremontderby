import test from 'node:test';
import assert from 'node:assert/strict';
import { venueLine } from '../src/venueLine.js';

test('a match card names the venue', () => {
  assert.equal(venueLine('4Bs'), 'Venue: 4Bs');
  assert.equal(venueLine(''), 'Venue not set');
});
