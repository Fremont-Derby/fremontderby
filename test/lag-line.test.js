import test from 'node:test';
import assert from 'node:assert/strict';
import { lagLine } from '../src/lagLine.js';

test('a handicap card names the lag', () => {
  assert.equal(lagLine('Ada'), 'Ada won the lag');
  assert.equal(lagLine(''), 'Lag not set');
});
