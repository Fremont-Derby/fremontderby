import test from 'node:test';
import assert from 'node:assert/strict';
import { ballInHandLine } from '../src/ballInHandLine.js';

test('a scorecard names ball in hand', () => {
  assert.equal(ballInHandLine('Ada'), 'Ada has ball in hand');
  assert.equal(ballInHandLine(''), '');
});
