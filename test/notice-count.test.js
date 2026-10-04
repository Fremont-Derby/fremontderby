import test from 'node:test';
import assert from 'node:assert/strict';
import { noticeCountLine } from '../src/noticeCount.js';

test('a notices header names the count', () => {
  assert.equal(noticeCountLine(1), '1 item needs attention');
  assert.equal(noticeCountLine(0), '0 items need attention');
});
