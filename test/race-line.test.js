import test from 'node:test';
import assert from 'node:assert/strict';
import { raceLine } from '../src/raceLine.js';

test('a handicap card names the race', () => {
  assert.equal(raceLine(5), 'Race to 5');
  assert.equal(raceLine(0), 'Race not set');
});
