import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAnchorTiebreaker,
  createChampionship,
  seedSemifinals,
} from '../domain/playoffs.js';

const chart = [
  { maxDiff: 49, strongerTo: 5, weakerTo: 5 },
  { maxDiff: 99, strongerTo: 6, weakerTo: 5 },
  { maxDiff: 999, strongerTo: 7, weakerTo: 4 },
];

test('seeds first versus fourth and second versus third', () => {
  assert.deepEqual(seedSemifinals(['t1', 't2', 't3', 't4']), [
    { round: 'semifinal', seedA: 1, teamAId: 't1', seedB: 4, teamBId: 't4' },
    { round: 'semifinal', seedA: 2, teamAId: 't2', seedB: 3, teamBId: 't3' },
  ]);
});

test('creates a championship from distinct semifinal winners', () => {
  assert.deepEqual(createChampionship([
    { winnerTeamId: 't1' },
    { winnerTeamId: 't3' },
  ]), {
    round: 'championship',
    teamAId: 't1',
    teamBId: 't3',
  });
});

test('creates a handicapped anchor match only for a tied championship', () => {
  const result = createAnchorTiebreaker({
    championship: { teamAId: 't1', teamBId: 't3' },
    teamAScore: 2,
    teamBScore: 2,
    anchorA: { playerId: 'p1', teamId: 't1', eligible: true, rating: 600 },
    anchorB: { playerId: 'p9', teamId: 't3', eligible: true, rating: 510 },
    chart,
    lagWinner: 'A',
    lagChoice: 'discipline',
    openingDiscipline: '8-ball',
  });

  assert.equal(result.round, 'championship-anchor');
  assert.equal(result.playerAId, 'p1');
  assert.equal(result.playerBId, 'p9');
  assert.deepEqual(result.match.targets, { a: 6, b: 5 });
  assert.equal(result.match.firstBreak, 'B');
});

test('rejects ineligible or wrong-team anchors', () => {
  assert.throws(() => createAnchorTiebreaker({
    championship: { teamAId: 't1', teamBId: 't3' },
    teamAScore: 2,
    teamBScore: 2,
    anchorA: { playerId: 'p1', teamId: 't2', eligible: true, rating: 600 },
    anchorB: { playerId: 'p9', teamId: 't3', eligible: true, rating: 510 },
    chart,
    lagWinner: 'A',
    lagChoice: 'break',
    openingDiscipline: '9-ball',
  }), /Team A anchor/);
});
