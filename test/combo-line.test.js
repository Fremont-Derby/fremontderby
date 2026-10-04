import test from 'node:test';
import assert from 'node:assert/strict';
import { comboLine } from '../src/comboLine.js';

test('a scorecard names a combo', () => {
  assert.equal(comboLine('Ada'), 'Ada made a combo');
  assert.equal(comboLine(''), '');
});
