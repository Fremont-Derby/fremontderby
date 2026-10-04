import test from 'node:test';
import assert from 'node:assert/strict';
import { doubleHillLine } from '../src/doubleHillLine.js';

test('a hill-hill match says so', () => {
  assert.equal(doubleHillLine(true), 'Both on the hill');
  assert.equal(doubleHillLine(false), '');
});
