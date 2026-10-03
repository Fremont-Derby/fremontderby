import test from 'node:test';
import assert from 'node:assert/strict';
import { winnerLine } from '../src/winnerLine.js';

test('a finished match names the winner', () => {
  assert.equal(winnerLine('Rail Riders'), 'Rail Riders won');
  assert.equal(winnerLine(''), '');
});
