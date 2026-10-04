import test from 'node:test';
import assert from 'node:assert/strict';
import { rainoutLine } from '../src/rainoutLine.js';

test('a called night says so', () => {
  assert.equal(rainoutLine(true), 'League night called');
  assert.equal(rainoutLine(false), '');
});
