import test from 'node:test';
import assert from 'node:assert/strict';
import { finalRackScore } from '../src/finalRackScore.js';

test('a finished match shows its rack score', () => {
  assert.equal(finalRackScore({ status: 'finalized', racksA: 5, racksB: 3 }), 'Racks 5–3');
  assert.equal(finalRackScore({ status: 'scheduled', racksA: 1, racksB: 0 }), '');
  assert.equal(finalRackScore({ status: 'finalized', racksA: 0, racksB: 0 }), '');
});
