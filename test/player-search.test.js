import test from 'node:test';
import assert from 'node:assert/strict';
import { playerSearch } from '../src/playerSearch.js';

test('a player search returns the named player', () => {
  const rows = playerSearch([{ displayName: 'Acorn Boats Captain' }, { displayName: 'Brockhouse Sam 0114' }], 'Brockhouse Sam 0114');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].displayName, 'Brockhouse Sam 0114');
});
