import test from 'node:test';
import assert from 'node:assert/strict';
import { masseLine } from '../src/masseLine.js';

test('a scorecard names a masse', () => {
  assert.equal(masseLine('Ada'), 'Ada played a masse');
  assert.equal(masseLine(''), '');
});
