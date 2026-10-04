import test from 'node:test';
import assert from 'node:assert/strict';
import { kickLine } from '../src/kickLine.js';

test('a scorecard names a kick', () => {
  assert.equal(kickLine('Ada'), 'Ada kicked it');
  assert.equal(kickLine(''), '');
});
