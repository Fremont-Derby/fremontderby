import test from 'node:test';
import assert from 'node:assert/strict';
import { noShowLine } from '../src/noShowLine.js';

test('a no-show names the player', () => {
  assert.equal(noShowLine('Ada'), 'Ada did not show');
  assert.equal(noShowLine(''), '');
});
