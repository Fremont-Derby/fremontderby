import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listEligibleFreeAgentsCommand,
  registerFreeAgentCommand,
  setFreeAgentAvailabilityCommand,
} from '../src/freeAgentCommands.js';

function createRepository() {
  const calls = [];

  return {
    calls,
    async registerFreeAgent(payload) {
      calls.push(['registerFreeAgent', payload]);
      return {
        season_id: payload.seasonId,
        player_id: 'player-1',
        participation_type: 'free_agent',
        status: 'active',
      };
    },
    async setFreeAgentAvailability(payload) {
      calls.push(['setFreeAgentAvailability', payload]);
      return {
        round_id: payload.roundId,
        player_id: 'player-1',
        status: payload.availabilityStatus,
      };
    },
    async listEligibleFreeAgents(payload) {
      calls.push(['listEligibleFreeAgents', payload]);
      return [{
        round_id: payload.roundId,
        player_id: 'player-2',
        display_name: 'Morgan',
        availability_status: 'available',
      }];
    },
  };
}

test('register free agent command registers the authenticated actor for a season', async () => {
  const repository = createRepository();

  const freeAgent = await registerFreeAgentCommand(
    { actorUserId: 'user-1', seasonId: 'season-1' },
    repository,
  );

  assert.deepEqual(freeAgent, {
    season_id: 'season-1',
    player_id: 'player-1',
    participation_type: 'free_agent',
    status: 'active',
  });
  assert.deepEqual(repository.calls, [
    ['registerFreeAgent', { actorUserId: 'user-1', seasonId: 'season-1' }],
  ]);
});

test('availability command saves allowed statuses for the authenticated actor', async () => {
  const repository = createRepository();

  const availability = await setFreeAgentAvailabilityCommand(
    { actorUserId: 'user-1', roundId: 'round-1', availabilityStatus: 'available' },
    repository,
  );

  assert.deepEqual(availability, {
    round_id: 'round-1',
    player_id: 'player-1',
    status: 'available',
  });
  assert.deepEqual(repository.calls, [
    ['setFreeAgentAvailability', {
      actorUserId: 'user-1',
      roundId: 'round-1',
      availabilityStatus: 'available',
    }],
  ]);
});

test('availability command rejects invalid status before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => setFreeAgentAvailabilityCommand(
      { actorUserId: 'user-1', roundId: 'round-1', availabilityStatus: 'maybe' },
      repository,
    ),
    /available, unavailable, or unsure/,
  );

  assert.deepEqual(repository.calls, []);
});

test('eligible free agents command lists captain-scoped candidates for a team round', async () => {
  const repository = createRepository();

  const freeAgents = await listEligibleFreeAgentsCommand(
    { actorUserId: 'captain-user-1', teamId: 'team-1', roundId: 'round-1' },
    repository,
  );

  assert.deepEqual(freeAgents, [{
    round_id: 'round-1',
    player_id: 'player-2',
    display_name: 'Morgan',
    availability_status: 'available',
  }]);
  assert.deepEqual(repository.calls, [
    ['listEligibleFreeAgents', {
      actorUserId: 'captain-user-1',
      teamId: 'team-1',
      roundId: 'round-1',
    }],
  ]);
});

test('eligible free agents command requires team and round ids', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => listEligibleFreeAgentsCommand(
      { actorUserId: 'captain-user-1', teamId: '', roundId: 'round-1' },
      repository,
    ),
    /teamId is required/,
  );
  await assert.rejects(
    () => listEligibleFreeAgentsCommand(
      { actorUserId: 'captain-user-1', teamId: 'team-1', roundId: '' },
      repository,
    ),
    /roundId is required/,
  );
  assert.deepEqual(repository.calls, []);
});
