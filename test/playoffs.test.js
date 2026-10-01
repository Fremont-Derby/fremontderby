import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAnchorTiebreaker,
  createChampionship,
  seedSemifinals,
  validatePostseasonLineup,
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

test('accepts a postseason lineup with three 4+ team players and a fourth 3+ player', () => {
  const result = validatePostseasonLineup([
    { playerId: 'p1', teamMatchesPlayed: 6 },
    { playerId: 'p2', teamMatchesPlayed: 4 },
    { playerId: 'p3', teamMatchesPlayed: 4 },
    { playerId: 'p4', teamMatchesPlayed: 3 },
  ]);

  assert.equal(result.eligible, true);
  assert.equal(result.fourMatchQualifierCount, 3);
  assert.equal(result.threeMatchQualifierCount, 4);
});

test('accepts four postseason players who each have 4+ team matches', () => {
  const result = validatePostseasonLineup([
    { playerId: 'p1', teamMatchesPlayed: 7 },
    { playerId: 'p2', teamMatchesPlayed: 5 },
    { playerId: 'p3', teamMatchesPlayed: 4 },
    { playerId: 'p4', teamMatchesPlayed: 4 },
  ]);

  assert.equal(result.fourMatchQualifierCount, 4);
});

test('rejects two 4+ players plus two 3-match players', () => {
  assert.throws(() => validatePostseasonLineup([
    { playerId: 'p1', teamMatchesPlayed: 5 },
    { playerId: 'p2', teamMatchesPlayed: 4 },
    { playerId: 'p3', teamMatchesPlayed: 3 },
    { playerId: 'p4', teamMatchesPlayed: 3 },
  ]), /three players with 4\+ team matches/);
});

test('postseason qualification uses team-specific match counts supplied by the caller', () => {
  assert.throws(() => validatePostseasonLineup([
    { playerId: 'p1', teamMatchesPlayed: 4 },
    { playerId: 'p2', teamMatchesPlayed: 4 },
    { playerId: 'p3', teamMatchesPlayed: 4 },
    { playerId: 'sub', teamMatchesPlayed: 2, totalLeagueMatchesPlayed: 6 },
  ]), /fourth with 3\+/);
});

test('postseason lineups require exactly four unique players', () => {
  assert.throws(() => validatePostseasonLineup([
    { playerId: 'p1', teamMatchesPlayed: 4 },
    { playerId: 'p2', teamMatchesPlayed: 4 },
    { playerId: 'p3', teamMatchesPlayed: 4 },
  ]), /exactly four players/);

  assert.throws(() => validatePostseasonLineup([
    { playerId: 'p1', teamMatchesPlayed: 4 },
    { playerId: 'p1', teamMatchesPlayed: 4 },
    { playerId: 'p3', teamMatchesPlayed: 4 },
    { playerId: 'p4', teamMatchesPlayed: 3 },
  ]), /must be unique/);
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

test('seedSemifinals rejects wrong roster size or duplicate teams', () => {
  assert.throws(() => seedSemifinals(['t1', 't2', 't3']), /exactly four seeded teams/);
  assert.throws(() => seedSemifinals(['t1', 't2', 't3', 't1']), /must be unique/);
});

test('createChampionship rejects missing or identical winners', () => {
  assert.throws(() => createChampionship([{ winnerTeamId: 't1' }]), /two semifinal results/);
  assert.throws(
    () => createChampionship([{ winnerTeamId: 't1' }, { winnerTeamId: 't1' }]),
    /different teams/,
  );
});
