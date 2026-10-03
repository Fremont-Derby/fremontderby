import test from 'node:test';
import assert from 'node:assert/strict';
import { playoffRacesOpened } from '../src/druLineupBypass.js';

test('a playoff lock without races is not a saved lineup', () => {
  assert.equal(playoffRacesOpened(
    [{ team_id: 'a' }, { team_id: 'b' }],
    [],
    'a',
    'b',
  ).text, 'Playoff races were not created.');
  assert.equal(playoffRacesOpened([{ team_id: 'a' }], [], 'a', 'b').text, 'Waiting for the other lineup.');
  assert.equal(playoffRacesOpened([{ team_id: 'a' }, { team_id: 'b' }], [{ id: 'race' }], 'a', 'b').text, 'Playoff races are open.');
});
