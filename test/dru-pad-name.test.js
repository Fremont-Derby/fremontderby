import test from 'node:test';
import assert from 'node:assert/strict';
import { playoffPadName } from '../src/druLineupBypass.js';

test('a padded playoff player does not reuse one name', () => {
  assert.equal(playoffPadName('match-aaaa'), 'Kite String aaaa');
  assert.notEqual(playoffPadName('match-aaaa'), playoffPadName('match-bbbb'));
});
