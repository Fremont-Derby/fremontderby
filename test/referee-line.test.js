import test from 'node:test';
import assert from 'node:assert/strict';
import { refereeLine } from '../src/refereeLine.js';

test('a match card names the referee', () => {
  assert.equal(refereeLine('Ada'), 'Referee: Ada');
  assert.equal(refereeLine(''), 'Referee not set');
});
