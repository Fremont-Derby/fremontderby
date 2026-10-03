import test from 'node:test';
import assert from 'node:assert/strict';
import { solidsLine } from '../src/solidsLine.js';

test('a rack names who has solids', () => {
  assert.equal(solidsLine('Ada'), 'Ada has solids');
  assert.equal(solidsLine(''), '');
});
