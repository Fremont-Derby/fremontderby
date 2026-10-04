import test from 'node:test';
import assert from 'node:assert/strict';
import { foulLine } from '../src/foulLine.js';

test('a scorecard names a foul', () => {
  assert.equal(foulLine('Ada'), 'Ada fouled');
  assert.equal(foulLine(''), '');
});
