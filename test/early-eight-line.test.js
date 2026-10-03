import test from 'node:test';
import assert from 'node:assert/strict';
import { earlyEightLine } from '../src/earlyEightLine.js';

test('a rack names an early eight', () => {
  assert.equal(earlyEightLine('Ada'), 'Ada made the eight early');
  assert.equal(earlyEightLine(''), '');
});
