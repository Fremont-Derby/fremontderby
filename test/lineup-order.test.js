import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupOrderLabel } from '../src/lineupOrder.js';

test('a lineup order names the players', () => {
  assert.equal(lineupOrderLabel(['Ada', 'Bea']), 'Order: Ada, Bea');
  assert.equal(lineupOrderLabel([]), '');
});
