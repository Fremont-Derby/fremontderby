import assert from 'node:assert/strict';
import test from 'node:test';
import { raceTargets, createMatch, recordRack } from '../domain/match.js';

const chart = [
  { maxDiff: 49, strongerTo: 5, weakerTo: 5 },
  { maxDiff: 99, strongerTo: 6, weakerTo: 5 },
  { maxDiff: 999, strongerTo: 7, weakerTo: 4 },
];

test('equal ratings use the stronger race length for both sides', () => {
  assert.deepEqual(raceTargets(500, 500, chart), { a: 5, b: 5 });
});

test('rating bands assign stronger/weaker race lengths', () => {
  assert.deepEqual(raceTargets(600, 520, chart), { a: 6, b: 5 });
  assert.deepEqual(raceTargets(520, 600, chart), { a: 5, b: 6 });
  assert.deepEqual(raceTargets(700, 400, chart), { a: 7, b: 4 });
});

test('raceTargets rejects empty chart', () => {
  assert.throws(() => raceTargets(500, 500, []), /Race chart is required/);
});

test('createMatch + recordRack reaches configured race target', () => {
  let match = createMatch({
    ratingA: 600,
    ratingB: 520,
    chart,
    lagWinner: 'A',
    lagChoice: 'discipline',
    openingDiscipline: '8-ball',
  });
  assert.equal(match.targets.a, 6);
  assert.equal(match.targets.b, 5);
  assert.deepEqual(match.score, { a: 0, b: 0 });
  for (let i = 0; i < 6; i += 1) match = recordRack(match, 'A');
  assert.equal(match.score.a, 6);
  assert.equal(match.winner, 'A');
  assert.equal(match.racks.length, 6);
});
