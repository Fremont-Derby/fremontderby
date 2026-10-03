import test from 'node:test';
import assert from 'node:assert/strict';
import { rosterCountLine } from '../src/rosterCount.js';

test('a team card names the roster count', () => {
  assert.equal(rosterCountLine('Rail Riders', 1), 'Rail Riders: 1 player');
  assert.equal(rosterCountLine('Rail Riders', 5), 'Rail Riders: 5 players');
});
