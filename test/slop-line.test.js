import test from 'node:test';
import assert from 'node:assert/strict';
import { slopLine } from '../src/slopLine.js';

test('a scorecard names a slop', () => {
  assert.equal(slopLine('Ada'), 'Ada slopped it');
  assert.equal(slopLine(''), '');
});
