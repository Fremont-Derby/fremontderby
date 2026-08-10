import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamWithCaptainCommand } from '../src/teamCommands.js';

function createRepository() {
  const calls = [];

  return {
    calls,
    async createTeamWithCaptain(payload) {
      calls.push(['createTeamWithCaptain', payload]);
      return {
        id: 'team-1',
        season_id: payload.seasonId,
        name: payload.teamName,
        captain_player_id: 'player-1',
      };
    },
  };
}

test('team creation command creates a team for the authenticated actor', async () => {
  const repository = createRepository();

  const team = await createTeamWithCaptainCommand(
    {
      actorUserId: 'user-1',
      seasonId: 'season-1',
      teamName: '  Breakers  ',
    },
    repository,
  );

  assert.deepEqual(team, {
    id: 'team-1',
    season_id: 'season-1',
    name: 'Breakers',
    captain_player_id: 'player-1',
  });
  assert.deepEqual(repository.calls, [
    ['createTeamWithCaptain', {
      actorUserId: 'user-1',
      seasonId: 'season-1',
      teamName: 'Breakers',
    }],
  ]);
});

test('team creation command rejects invalid team names before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => createTeamWithCaptainCommand(
      { actorUserId: 'user-1', seasonId: 'season-1', teamName: ' ' },
      repository,
    ),
    /teamName is required/,
  );
  await assert.rejects(
    () => createTeamWithCaptainCommand(
      { actorUserId: 'user-1', seasonId: 'season-1', teamName: 'x'.repeat(81) },
      repository,
    ),
    /80 characters or fewer/,
  );

  assert.deepEqual(repository.calls, []);
});
