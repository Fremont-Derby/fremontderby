import test from 'node:test';
import assert from 'node:assert/strict';
import { shotClockLine } from '../src/shotClockLine.js';

test('a live rack names the shot clock', () => {
  assert.equal(shotClockLine(30), 'Shot clock: 30s');
  assert.equal(shotClockLine(0), 'Shot clock not set');
});
