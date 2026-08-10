import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listTeamRoundAvailabilityCommand,
  setRosterAvailabilityCommand,
} from '../src/availabilityCommands.js';

function createRepository() {
  const calls = [];

  return {
    calls,
    async setRosterAvailability(payload) {
      calls.push(['setRosterAvailability', payload]);
      return {
        round_id: payload.roundId,
        team_id: 'team-1',
        player_id: 'player-1',
        status: payload.availabilityStatus,
      };
    },
    async listTeamRoundAvailability(payload) {
      calls.push(['listTeamRoundAvailability', payload]);
      return [{
        round_id: payload.roundId,
        team_id: payload.teamId,
        player_id: 'player-1',
        participation_type: 'roster',
        availability_status: 'available',
      }];
    },
  };
}

test('roster availability command saves allowed statuses for the authenticated actor', async () => {
  const repository = createRepository();

  const availability = await setRosterAvailabilityCommand(
    { actorUserId: 'user-1', roundId: 'round-1', availabilityStatus: 'available' },
    repository,
  );

  assert.deepEqual(availability, {
    round_id: 'round-1',
    team_id: 'team-1',
    player_id: 'player-1',
    status: 'available',
  });
  assert.deepEqual(repository.calls, [
    ['setRosterAvailability', {
      actorUserId: 'user-1',
      roundId: 'round-1',
      availabilityStatus: 'available',
    }],
  ]);
});

test('roster availability command rejects invalid status before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => setRosterAvailabilityCommand(
      { actorUserId: 'user-1', roundId: 'round-1', availabilityStatus: 'maybe' },
      repository,
    ),
    /available, unavailable, or unsure/,
  );

  assert.deepEqual(repository.calls, []);
});

test('team round availability command lists captain-scoped roster and free-agent rows', async () => {
  const repository = createRepository();

  const availability = await listTeamRoundAvailabilityCommand(
    { actorUserId: 'captain-user-1', teamId: 'team-1', roundId: 'round-1' },
    repository,
  );

  assert.deepEqual(availability, [{
    round_id: 'round-1',
    team_id: 'team-1',
    player_id: 'player-1',
    participation_type: 'roster',
    availability_status: 'available',
  }]);
  assert.deepEqual(repository.calls, [
    ['listTeamRoundAvailability', {
      actorUserId: 'captain-user-1',
      teamId: 'team-1',
      roundId: 'round-1',
    }],
  ]);
});

test('team round availability command requires team and round ids', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => listTeamRoundAvailabilityCommand(
      { actorUserId: 'captain-user-1', teamId: '', roundId: 'round-1' },
      repository,
    ),
    /teamId is required/,
  );
  await assert.rejects(
    () => listTeamRoundAvailabilityCommand(
      { actorUserId: 'captain-user-1', teamId: 'team-1', roundId: '' },
      repository,
    ),
    /roundId is required/,
  );
  assert.deepEqual(repository.calls, []);
});
