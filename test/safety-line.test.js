import test from 'node:test';
import assert from 'node:assert/strict';
import { safetyLine } from '../src/safetyLine.js';

test('a scorecard names a safety', () => {
  assert.equal(safetyLine('Ada'), 'Ada played a safety');
  assert.equal(safetyLine(''), '');
});
