import test from 'node:test';
import assert from 'node:assert/strict';
import { prizePlaceLine } from '../src/prizePlace.js';

test('a prize row names the place and team', () => {
  assert.equal(prizePlaceLine(1, 'Rail Riders'), 'Place 1: Rail Riders');
});
