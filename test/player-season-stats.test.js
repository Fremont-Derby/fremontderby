import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePlayerSeasonMatches, mergeDisputeTimeline } from '../src/playerSeasonStats.js';

test('summarize finalized matches', () => {
  const s = summarizePlayerSeasonMatches([
    { status: 'finalized', winnerPlayerId: 'me', selfPlayerId: 'me', racksWon: 5, racksLost: 2, discipline: '8-ball' },
    { status: 'finalized', winnerPlayerId: 'opp', selfPlayerId: 'me', racksWon: 3, racksLost: 5, discipline: '9-ball' },
  ]);
  assert.equal(s.matchesPlayed, 2);
  assert.equal(s.wins, 1);
  assert.equal(s.losses, 1);
  assert.equal(s.rackDifferential, 1);
});

test('timeline merges audit and matches', () => {
  const t = mergeDisputeTimeline(
    [{ action: 'rating.record_observation', created_at: '2026-08-01' }],
    [{ date: '2026-08-02', result: 'W' }],
  );
  assert.equal(t.length, 2);
  assert.equal(t[0].kind, 'audit');
});
