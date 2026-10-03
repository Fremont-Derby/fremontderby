import test from 'node:test';
import assert from 'node:assert/strict';
import { lastBallLine } from '../src/lastBallLine.js';

test('a scorecard names the last ball', () => {
  assert.equal(lastBallLine('9'), 'Last ball: 9');
  assert.equal(lastBallLine(''), 'Last ball not set');
});
