import test from 'node:test';
import assert from 'node:assert/strict';
import { raceLine } from '../src/raceLine.js';

test('a handicap card names the race length', () => {
  assert.equal(raceLine(7), 'Race to 7');
  assert.equal(raceLine(2), 'Race not set');
});
