import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRoster } from '../src/prepareRoster.js';

test('a forming team gets three kid-safe players and 555 phones', () => {
  const roster = prepareRoster('Moth Lanterns');
  assert.equal(roster.length, 3);
  assert.equal(roster[0].name, 'Moth Lanterns Captain');
  assert.equal(roster.every(player => player.phone.startsWith('555')), true);
});
