import test from 'node:test';
import assert from 'node:assert/strict';
import { deadBallLine } from '../src/deadBallLine.js';

test('a scorecard names a dead ball', () => {
  assert.equal(deadBallLine('4'), 'Dead ball: 4');
  assert.equal(deadBallLine(''), '');
});
