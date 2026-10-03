import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateFromStoredMatch } from '../src/challongePublish.js';

test('a Challonge dry-run uses the stored player names and rack winners', () => {
  const candidate = candidateFromStoredMatch({
    playerMatchId: 'cec3d3a0-ad69-4ff4-8c4b-de95af629aca',
    playerAId: 'a',
    playerBId: 'b',
    playerAName: 'Grok Fill 07 713',
    playerBName: 'DRU Test Actor',
    racks: [{ winnerId: 'b', discipline: '8-ball' }],
  });
  assert.equal(candidate.playerAName, 'Grok Fill 07 713');
  assert.equal(candidate.racksA, 0);
  assert.equal(candidate.racksB, 1);
});
