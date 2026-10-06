import test from 'node:test';
import assert from 'node:assert/strict';
import { playedPlayers } from '../src/individualPlace.js';

test('a player with no matches is not ranked', () => {
  const rows = playedPlayers([{ display_name: 'Banks Sam 0106', matches_played: 0 }, { display_name: 'Woody Pip 0106', matches_played: 2 }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].display_name, 'Woody Pip 0106');
});
