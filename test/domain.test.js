import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoundRobin } from '../domain/schedule.js';
import { createMatch, raceTargets, recordRack } from '../domain/match.js';

test('8 teams generate 7 fair rounds with each pairing exactly once', () => {
  const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const rounds = generateRoundRobin(teams);

  assert.equal(rounds.length, 7);

  const appearances = new Map(teams.map((team) => [team, 0]));
  const pairs = new Set();

  for (const round of rounds) {
    assert.equal(round.matches.length, 4);
    const seenThisRound = new Set();

    for (const { teamA, teamB } of round.matches) {
      assert.ok(!seenThisRound.has(teamA));
      assert.ok(!seenThisRound.has(teamB));
      seenThisRound.add(teamA);
      seenThisRound.add(teamB);

      appearances.set(teamA, appearances.get(teamA) + 1);
      appearances.set(teamB, appearances.get(teamB) + 1);
      pairs.add([teamA, teamB].sort().join('-'));
    }

    assert.equal(seenThisRound.size, 8);
  }

  assert.equal(pairs.size, 28);
  for (const count of appearances.values()) {
    assert.equal(count, 7);
  }
});

test('schedule generation is deterministic', () => {
  const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  assert.deepEqual(generateRoundRobin(teams), generateRoundRobin(teams));
});

const chart = [
  { maxDiff: 20, strongerTo: 5, weakerTo: 5 },
  { maxDiff: 60, strongerTo: 5, weakerTo: 4 },
  { maxDiff: 110, strongerTo: 5, weakerTo: 3 },
  { maxDiff: Infinity, strongerTo: 5, weakerTo: 2 },
];

test('race chart is deterministic and symmetric', () => {
  assert.deepEqual(raceTargets(550, 500, chart), { a: 5, b: 4 });
  assert.deepEqual(raceTargets(500, 550, chart), { a: 4, b: 5 });
});

test('lag choice and opening block switch disciplines without resetting score', () => {
  let match = createMatch({
    ratingA: 550,
    ratingB: 500,
    chart,
    openingBlockLength: 3,
    lagWinner: 'A',
    lagChoice: 'discipline',
    openingDiscipline: '8-ball',
  });

  assert.equal(match.firstBreak, 'B');
  assert.equal(match.currentDiscipline, '8-ball');

  match = recordRack(match, 'A');
  match = recordRack(match, 'B');
  match = recordRack(match, 'A');

  assert.deepEqual(match.score, { a: 2, b: 1 });
  assert.equal(match.currentDiscipline, '9-ball');

  match = recordRack(match, 'A');
  assert.deepEqual(match.score, { a: 3, b: 1 });
});

test('taking first break gives discipline choice to the opponent', () => {
  const match = createMatch({
    ratingA: 550,
    ratingB: 500,
    chart,
    lagWinner: 'A',
    lagChoice: 'break',
    openingDiscipline: '9-ball',
  });

  assert.equal(match.firstBreak, 'A');
  assert.equal(match.openingDiscipline, '9-ball');
});

test('match ends only when a race target is reached', () => {
  let match = createMatch({
    ratingA: 550,
    ratingB: 500,
    chart,
    lagWinner: 'A',
    lagChoice: 'break',
    openingDiscipline: '9-ball',
  });

  for (const winner of ['A', 'A', 'A', 'A']) {
    match = recordRack(match, winner);
  }
  assert.equal(match.winner, null);

  match = recordRack(match, 'A');
  assert.equal(match.winner, 'A');
  assert.throws(() => recordRack(match, 'B'), /already complete/);
});

test('createMatch rejects invalid lag and opening discipline inputs', () => {
  const base = {
    ratingA: 550,
    ratingB: 500,
    chart,
    lagWinner: 'A',
    lagChoice: 'discipline',
    openingDiscipline: '8-ball',
  };
  assert.throws(() => createMatch({ ...base, lagWinner: 'C' }), /lagWinner/);
  assert.throws(() => createMatch({ ...base, lagChoice: 'serve' }), /lagChoice/);
  assert.throws(() => createMatch({ ...base, openingDiscipline: '10-ball' }), /openingDiscipline/);
  assert.throws(() => createMatch({ ...base, openingBlockLength: 0 }), /openingBlockLength/);
});
