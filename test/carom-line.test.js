import test from 'node:test';
import assert from 'node:assert/strict';
import { caromLine } from '../src/caromLine.js';

test('a scorecard names a carom', () => {
  assert.equal(caromLine('Ada'), 'Ada made a carom');
  assert.equal(caromLine(''), '');
});
