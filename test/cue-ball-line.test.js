import test from 'node:test';
import assert from 'node:assert/strict';
import { cueBallLine } from '../src/cueBallLine.js';

test('a scorecard names a scratched cue ball', () => {
  assert.equal(cueBallLine('Ada'), 'Ada scratched the cue ball');
  assert.equal(cueBallLine(''), '');
});
