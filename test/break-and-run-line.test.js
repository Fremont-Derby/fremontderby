import test from 'node:test';
import assert from 'node:assert/strict';
import { breakAndRunLine } from '../src/breakAndRunLine.js';

test('a rack names a break and run', () => {
  assert.equal(breakAndRunLine('Ada'), 'Ada broke and ran');
  assert.equal(breakAndRunLine(''), '');
});
