import test from 'node:test';
import assert from 'node:assert/strict';
import { bankLine } from '../src/bankLine.js';

test('a scorecard names a bank', () => {
  assert.equal(bankLine('Ada'), 'Ada banked it');
  assert.equal(bankLine(''), '');
});
