import test from 'node:test';
import assert from 'node:assert/strict';
import { dryBreakLine } from '../src/dryBreakLine.js';

test('a rack names a dry break', () => {
  assert.equal(dryBreakLine('Ada'), 'Ada dry broke');
  assert.equal(dryBreakLine(''), '');
});
