import test from 'node:test';
import assert from 'node:assert/strict';
import { breakLine } from '../src/breakLine.js';

test('a match card names the break', () => {
  assert.equal(breakLine('Ada'), 'Ada breaks');
  assert.equal(breakLine(''), 'Break not set');
});
