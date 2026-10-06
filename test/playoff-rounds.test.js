import test from 'node:test';
import assert from 'node:assert/strict';
import { playoffRounds } from '../src/playoffRounds.js';

test('a playoffs request does not return the regular schedule', () => {
  const rounds = playoffRounds([{ stage: 'regular', roundNumber: 1 }, { stage: 'semifinal', roundNumber: 8 }]);
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].stage, 'semifinal');
});
