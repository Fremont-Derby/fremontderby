import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceLine } from '../src/practiceLine.js';

test('a practice match says it does not count', () => {
  assert.equal(practiceLine(true), 'Practice match, does not count');
  assert.equal(practiceLine(false), '');
});
