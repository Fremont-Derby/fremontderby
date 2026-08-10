import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSeasonSetupCommand,
  saveSeasonSetupCommand,
} from '../src/seasonSetupCommands.js';

const setupInput = {
  actorUserId: 'admin-user-1',
  seasonId: 'season-1',
  seasonName: ' Fremont Derby Season 1 ',
  leagueNight: ' Thursday ',
  firstRoundDate: '2026-09-03',
  rosterLockRound: '5',
  openingBlockLength: 3,
  individualMinMatches: 5,
  roundIntervalDays: 7,
  tableNumbers: '1,2,3,4',
  raceChartVersion: ' season-1-default ',
  playoffTeamCount: 4,
  playoffAnchorTiebreaker: true,
};

test('season setup read command loads admin-scoped setup details', async () => {
  const calls = [];
  const repository = {
    async getSeasonSetup(payload) {
      calls.push(payload);
      return { id: payload.seasonId, teams: [], rounds: [] };
    },
  };

  const setup = await getSeasonSetupCommand(
    { actorUserId: 'admin-user-1', seasonId: 'season-1' },
    repository,
  );

  assert.equal(setup.id, 'season-1');
  assert.deepEqual(calls, [{ actorUserId: 'admin-user-1', seasonId: 'season-1' }]);
});

test('season setup read command treats missing setup as not found', async () => {
  const repository = { getSeasonSetup: async () => null };

  await assert.rejects(
    () => getSeasonSetupCommand(
      { actorUserId: 'admin-user-1', seasonId: 'missing-season' },
      repository,
    ),
    /Season not found/,
  );
});

test('season setup save command normalizes setup fields', async () => {
  const calls = [];
  const repository = {
    async saveSeasonSetup(payload) {
      calls.push(payload);
      return { id: payload.seasonId, name: payload.seasonName };
    },
  };

  const setup = await saveSeasonSetupCommand(setupInput, repository);

  assert.equal(setup.name, 'Fremont Derby Season 1');
  assert.deepEqual(calls[0], {
    actorUserId: 'admin-user-1',
    seasonId: 'season-1',
    seasonName: 'Fremont Derby Season 1',
    leagueNight: 'Thursday',
    firstRoundDate: '2026-09-03',
    rosterLockRound: 5,
    openingBlockLength: 3,
    individualMinMatches: 5,
    roundIntervalDays: 7,
    tableNumbers: [1, 2, 3, 4],
    raceChartVersion: 'season-1-default',
    playoffTeamCount: 4,
    playoffAnchorTiebreaker: true,
  });
});

test('season setup save command allows creating a season without an existing season id', async () => {
  const repository = {
    async saveSeasonSetup(payload) {
      return { id: payload.seasonId ?? 'created-season-1' };
    },
  };

  const setup = await saveSeasonSetupCommand(
    { ...setupInput, seasonId: null },
    repository,
  );

  assert.equal(setup.id, 'created-season-1');
});

test('season setup save command validates dates and table numbers before writing', async () => {
  const repository = { saveSeasonSetup: async () => ({}) };

  await assert.rejects(
    () => saveSeasonSetupCommand(
      { ...setupInput, firstRoundDate: '2026-02-31' },
      repository,
    ),
    /valid calendar date/,
  );

  await assert.rejects(
    () => saveSeasonSetupCommand(
      { ...setupInput, tableNumbers: [1, 1, 2, 3] },
      repository,
    ),
    /unique/,
  );
});
