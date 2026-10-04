import test from 'node:test';
import assert from 'node:assert/strict';
import { startTimeLine } from '../src/startTimeLine.js';

test('a match card names the start time', () => {
  assert.equal(startTimeLine('7:00'), 'Starts 7:00');
  assert.equal(startTimeLine(''), 'Start time not set');
});
