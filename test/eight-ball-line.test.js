import test from 'node:test';
import assert from 'node:assert/strict';
import { eightBallLine } from '../src/eightBallLine.js';

test('a finished rack names who made the eight', () => {
  assert.equal(eightBallLine('Ada'), 'Ada made the eight');
  assert.equal(eightBallLine(''), '');
});
