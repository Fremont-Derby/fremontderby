import test from 'node:test';
import assert from 'node:assert/strict';
import { lateLine } from '../src/lateLine.js';

test('a late arrival names the player', () => {
  assert.equal(lateLine('Ada'), 'Ada is late');
  assert.equal(lateLine(''), '');
});
