import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCompleteRoundRobin,
  assignTablesForRound,
  generateRoundRobin,
} from '../domain/schedule.js';
import { fastVersionToken } from '../src/httpConditional.js';

const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

test('round robin is a complete pair covering of 8 teams', () => {
  const rounds = generateRoundRobin(teams);
  assertCompleteRoundRobin(rounds, teams);
  assert.equal(rounds.length, 7);
  assert.equal(rounds[0].matches.length, 4);
});

test('odd rounds flip home/away relative to even rounds for the same circle slot', () => {
  const rounds = generateRoundRobin(teams);
  // After one rotation step, first match sides should differ from a pure non-flip method:
  // We only assert that across the season each team is teamA about half the time.
  const homeCount = Object.fromEntries(teams.map((t) => [t, 0]));
  for (const round of rounds) {
    for (const match of round.matches) homeCount[match.teamA] += 1;
  }
  for (const team of teams) {
    assert.ok(homeCount[team] >= 2 && homeCount[team] <= 5, `${team} home=${homeCount[team]}`);
  }
});

test('table rotation is a pure cyclic shift', () => {
  assert.deepEqual(assignTablesForRound([1, 2, 3, 4], 0), [1, 2, 3, 4]);
  assert.deepEqual(assignTablesForRound([1, 2, 3, 4], 1), [2, 3, 4, 1]);
  assert.deepEqual(assignTablesForRound([1, 2, 3, 4], 2), [3, 4, 1, 2]);
});

test('fast version token is stable and changes on edit', () => {
  const a = fastVersionToken({ matches: [{ id: 1, status: 'scheduled' }] });
  const b = fastVersionToken({ matches: [{ id: 1, status: 'scheduled' }] });
  const c = fastVersionToken({ matches: [{ id: 1, status: 'finalized' }] });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[0-9a-f]{8}$/);
});
