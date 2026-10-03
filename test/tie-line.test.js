import test from 'node:test';
import assert from 'node:assert/strict';
import { tieLine } from '../src/tieLine.js';

test('a tied match says so', () => {
  assert.equal(tieLine(true), 'Match tied');
  assert.equal(tieLine(false), '');
});
