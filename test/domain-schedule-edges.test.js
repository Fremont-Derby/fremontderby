import assert from 'node:assert/strict';
import test from 'node:test';
import { generateRoundRobin } from '../domain/schedule.js';
import { createMatch, recordRack } from '../domain/match.js';

test('generateRoundRobin rejects non-8 rosters and duplicates', () => {
  assert.throws(() => generateRoundRobin(['A', 'B', 'C']), /exactly 8 teams/);
  assert.throws(
    () => generateRoundRobin(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']),
    /exactly 8 teams/,
  );
  assert.throws(
    () => generateRoundRobin(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A']),
    /unique/,
  );
});

const chart = [
  { maxDiff: 49, strongerTo: 5, weakerTo: 5 },
  { maxDiff: 99, strongerTo: 6, weakerTo: 5 },
  { maxDiff: 999, strongerTo: 7, weakerTo: 4 },
];

test('9-ball opening block flips to 8-ball after openingBlockLength racks', () => {
  let match = createMatch({
    ratingA: 500,
    ratingB: 500,
    chart,
    openingBlockLength: 3,
    lagWinner: 'B',
    lagChoice: 'discipline',
    openingDiscipline: '9-ball',
  });
  assert.equal(match.firstBreak, 'A');
  assert.equal(match.currentDiscipline, '9-ball');
  match = recordRack(match, 'A');
  match = recordRack(match, 'B');
  match = recordRack(match, 'A');
  assert.equal(match.currentDiscipline, '8-ball');
  assert.deepEqual(match.score, { a: 2, b: 1 });
});

test('underdog can win the race before the favorite reaches target', () => {
  let match = createMatch({
    ratingA: 700,
    ratingB: 400,
    chart,
    lagWinner: 'A',
    lagChoice: 'break',
    openingDiscipline: '8-ball',
  });
  // A races to 7, B to 4
  assert.deepEqual(match.targets, { a: 7, b: 4 });
  for (let i = 0; i < 4; i += 1) match = recordRack(match, 'B');
  assert.equal(match.winner, 'B');
  assert.equal(match.score.b, 4);
  assert.equal(match.score.a, 0);
  assert.throws(() => recordRack(match, 'A'), /already complete/);
});

test('recordRack rejects invalid winners', () => {
  const match = createMatch({
    ratingA: 500,
    ratingB: 500,
    chart,
    lagWinner: 'A',
    lagChoice: 'break',
    openingDiscipline: '8-ball',
  });
  assert.throws(() => recordRack(match, 'C'), /winner must be A or B/);
});
