import test from 'node:test';
import assert from 'node:assert/strict';
import { warningLine } from '../src/warningLine.js';

test('a live rack names a warning', () => {
  assert.equal(warningLine('Ada'), 'Ada has a warning');
  assert.equal(warningLine(''), '');
});
