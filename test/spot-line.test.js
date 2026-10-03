import test from 'node:test';
import assert from 'node:assert/strict';
import { spotLine } from '../src/spotLine.js';

test('a handicap card names the spot', () => {
  assert.equal(spotLine(2), 'Spot: 2');
  assert.equal(spotLine(0), 'Spot not set');
});
