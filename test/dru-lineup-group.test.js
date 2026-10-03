import test from 'node:test';
import assert from 'node:assert/strict';
import { playoffPadName, playoffRacesOpened, regularSeasonReady } from '../src/druLineupGroup.js';

test('lineup group rules', () => {
  assert.notEqual(playoffPadName('match-aaaa'), playoffPadName('match-bbbb'));
  assert.equal(playoffRacesOpened([{ team_id: 'a' }, { team_id: 'b' }], [], 'a', 'b').ok, false);
  assert.equal(regularSeasonReady([{ status: 'finalized', winner_team_id: 'a' }]), false);
  assert.equal(regularSeasonReady(Array.from({ length: 28 }, () => ({ status: 'finalized', winner_team_id: 'a' }))), true);
});
