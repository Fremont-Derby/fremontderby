import test from 'node:test';
import assert from 'node:assert/strict';
import { wrongBallLine } from '../src/wrongBallLine.js';

test('a scorecard names a wrong ball', () => {
  assert.equal(wrongBallLine('Ada'), 'Ada hit the wrong ball');
  assert.equal(wrongBallLine(''), '');
});
