import test from 'node:test';
import assert from 'node:assert/strict';
import { weekLine } from '../src/weekLine.js';

test('a round header names the week', () => {
  assert.equal(weekLine(4), 'Week 4');
  assert.equal(weekLine(0), 'Week not set');
});
