import test from 'node:test';
import assert from 'node:assert/strict';
import { resultStateLine } from '../src/resultState.js';

test('a result says whether it is complete', () => {
  assert.equal(resultStateLine(true), 'Result complete');
  assert.equal(resultStateLine(false), 'Score still needed');
});
