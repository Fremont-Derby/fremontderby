import test from 'node:test';
import assert from 'node:assert/strict';
import { nineBallLine } from '../src/nineBallLine.js';

test('a finished rack names who made the nine', () => {
  assert.equal(nineBallLine('Ada'), 'Ada made the nine');
  assert.equal(nineBallLine(''), '');
});
