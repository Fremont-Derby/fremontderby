import test from 'node:test';
import assert from 'node:assert/strict';
import { listTeamStandingsCommand } from '../src/standingsCommands.js';

test('team standings command lists standings for a season', async () => {
  const calls = [];
  const repository = {
    async listTeamStandings(payload) {
      calls.push(payload);
      return [{
        season_id: payload.seasonId,
        team_id: 'team-1',
        standings_rank: 1,
        standing_points: 2,
      }];
    },
  };

  const standings = await listTeamStandingsCommand(
    { seasonId: 'season-1' },
    repository,
  );

  assert.equal(standings[0].team_id, 'team-1');
  assert.deepEqual(calls, [{ seasonId: 'season-1' }]);
});

test('team standings command validates season id before reading', async () => {
  const repository = { listTeamStandings: async () => [] };

  await assert.rejects(
    () => listTeamStandingsCommand({ seasonId: '' }, repository),
    /seasonId is required/,
  );
});
