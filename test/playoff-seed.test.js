import test from 'node:test';
import assert from 'node:assert/strict';
import { playoffSeedLine } from '../src/playoffSeed.js';

test('a playoff card names the seed and team', () => {
  assert.equal(playoffSeedLine(1, 'Rail Riders'), 'Seed 1: Rail Riders');
});
