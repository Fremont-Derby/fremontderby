import test from 'node:test';
import assert from 'node:assert/strict';
import { publishRegularSeasonSchedule } from '../domain/season.js';

const teams = ['team-1', 'team-2', 'team-3', 'team-4', 'team-5', 'team-6', 'team-7', 'team-8'];

test('publishing a regular season creates seven weekly rounds', () => {
  const schedule = publishRegularSeasonSchedule({
    seasonId: 'season-1',
    teamIds: teams,
    firstRoundDate: '2026-09-03',
  });

  assert.equal(schedule.seasonId, 'season-1');
  assert.equal(schedule.status, 'active');
  assert.equal(schedule.rounds.length, 7);
  assert.deepEqual(
    schedule.rounds.map((round) => round.scheduledOn),
    [
      '2026-09-03',
      '2026-09-10',
      '2026-09-17',
      '2026-09-24',
      '2026-10-01',
      '2026-10-08',
      '2026-10-15',
    ],
  );
});

test('published rounds include four table-assigned team matches', () => {
  const schedule = publishRegularSeasonSchedule({
    seasonId: 'season-1',
    teamIds: teams,
    firstRoundDate: '2026-09-03',
    tableNumbers: [5, 6, 7, 8],
  });

  for (const round of schedule.rounds) {
    assert.equal(round.stage, 'regular');
    assert.equal(round.matches.length, 4);
    assert.deepEqual(
      round.matches.map((match) => match.tableNumber),
      [5, 6, 7, 8],
    );

    const teamsInRound = new Set();
    for (const match of round.matches) {
      assert.equal(match.seasonId, 'season-1');
      assert.equal(match.roundNumber, round.roundNumber);
      assert.equal(match.stage, 'regular');
      teamsInRound.add(match.teamAId);
      teamsInRound.add(match.teamBId);
    }
    assert.equal(teamsInRound.size, 8);
  }
});

test('season publication rejects invalid setup inputs', () => {
  assert.throws(
    () => publishRegularSeasonSchedule({
      seasonId: 'season-1',
      teamIds: teams.slice(0, 7),
      firstRoundDate: '2026-09-03',
    }),
    /exactly 8 teams/,
  );

  assert.throws(
    () => publishRegularSeasonSchedule({
      seasonId: 'season-1',
      teamIds: teams,
      firstRoundDate: '2026-02-31',
    }),
    /valid calendar date/,
  );

  assert.throws(
    () => publishRegularSeasonSchedule({
      seasonId: 'season-1',
      teamIds: teams,
      firstRoundDate: '2026-09-03',
      tableNumbers: [1, 1, 2, 3],
    }),
    /unique/,
  );
});

test('season publication rejects non-positive interval and missing season id', () => {
  assert.throws(
    () => publishRegularSeasonSchedule({
      seasonId: 'season-1',
      teamIds: teams,
      firstRoundDate: '2026-09-03',
      intervalDays: 0,
    }),
    /intervalDays/,
  );
  assert.throws(
    () => publishRegularSeasonSchedule({
      teamIds: teams,
      firstRoundDate: '2026-09-03',
    }),
    /seasonId is required/,
  );
});

test('publishing supports custom positive intervalDays', () => {
  const schedule = publishRegularSeasonSchedule({
    seasonId: 'season-1',
    teamIds: teams,
    firstRoundDate: '2026-09-03',
    intervalDays: 14,
  });
  assert.deepEqual(
    schedule.rounds.map((round) => round.scheduledOn),
    [
      '2026-09-03',
      '2026-09-17',
      '2026-10-01',
      '2026-10-15',
      '2026-10-29',
      '2026-11-12',
      '2026-11-26',
    ],
  );
});
