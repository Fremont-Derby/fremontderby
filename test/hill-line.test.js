import test from 'node:test';
import assert from 'node:assert/strict';
import { hillLine } from '../src/hillLine.js';

test('a live match names who is on the hill', () => {
  assert.equal(hillLine('Ada'), 'Ada is on the hill');
  assert.equal(hillLine(''), '');
});
