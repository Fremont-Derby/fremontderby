import test from 'node:test';
import assert from 'node:assert/strict';
import { captainLine } from '../src/captainLine.js';

test('a team card names the captain', () => {
  assert.equal(captainLine('Rail Riders', 'Ada'), 'Rail Riders captain: Ada');
  assert.equal(captainLine('Rail Riders', ''), 'Rail Riders captain: not set');
});
