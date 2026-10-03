import test from 'node:test';
import assert from 'node:assert/strict';
import { scratchLine } from '../src/scratchLine.js';

test('a scorecard names a scratch', () => {
  assert.equal(scratchLine('Ada'), 'Ada scratched');
  assert.equal(scratchLine(''), '');
});
