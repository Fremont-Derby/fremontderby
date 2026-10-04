import test from 'node:test';
import assert from 'node:assert/strict';
import { concessionLine } from '../src/concessionLine.js';

test('a finished rack names a concession', () => {
  assert.equal(concessionLine('Ada'), 'Ada conceded');
  assert.equal(concessionLine(''), '');
});
