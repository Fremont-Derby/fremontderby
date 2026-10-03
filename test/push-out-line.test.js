import test from 'node:test';
import assert from 'node:assert/strict';
import { pushOutLine } from '../src/pushOutLine.js';

test('a scorecard names a push-out', () => {
  assert.equal(pushOutLine('Ada'), 'Ada played a push-out');
  assert.equal(pushOutLine(''), '');
});
