import test from 'node:test';
import assert from 'node:assert/strict';
import { timeoutLine } from '../src/timeoutLine.js';

test('a stalled match says the table timed out', () => {
  assert.equal(timeoutLine(true), 'Table timed out');
  assert.equal(timeoutLine(false), '');
});
