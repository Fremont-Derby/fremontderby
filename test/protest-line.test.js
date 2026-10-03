import test from 'node:test';
import assert from 'node:assert/strict';
import { protestLine } from '../src/protestLine.js';

test('a protested match says so', () => {
  assert.equal(protestLine(true), 'Score under protest');
  assert.equal(protestLine(false), '');
});
