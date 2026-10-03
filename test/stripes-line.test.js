import test from 'node:test';
import assert from 'node:assert/strict';
import { stripesLine } from '../src/stripesLine.js';

test('a rack names who has stripes', () => {
  assert.equal(stripesLine('Ada'), 'Ada has stripes');
  assert.equal(stripesLine(''), '');
});
