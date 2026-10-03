import test from 'node:test';
import assert from 'node:assert/strict';
import { jumpLine } from '../src/jumpLine.js';

test('a scorecard names a jump', () => {
  assert.equal(jumpLine('Ada'), 'Ada jumped it');
  assert.equal(jumpLine(''), '');
});
