import test from 'node:test';
import assert from 'node:assert/strict';
import { claimLine } from '../src/claimLine.js';

test('a profile claim names the player', () => {
  assert.equal(claimLine('Ada', false), 'Ada: unclaimed');
  assert.equal(claimLine('Ada', true), 'Ada: claimed');
});
