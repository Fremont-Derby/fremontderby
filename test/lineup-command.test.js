import test from 'node:test';
import assert from 'node:assert/strict';
import { submitTeamLineupCommand } from '../src/lineupCommands.js';

function createRepository() {
  const calls = [];

  return {
    calls,
    async submitTeamLineup(payload) {
      calls.push(['submitTeamLineup', payload]);
      return payload.slots.map((slot) => ({
        round_id: payload.roundId,
        team_id: payload.teamId,
        slot_number: slot.slotNumber,
        player_id: slot.playerId,
        participation_type: slot.playerId ? 'roster' : 'forfeit',
      }));
    },
  };
}

test('submit lineup command normalizes ordered lineup slots', async () => {
  const repository = createRepository();

  const lineup = await submitTeamLineupCommand(
    {
      actorUserId: 'captain-user-1',
      teamId: 'team-1',
      roundId: 'round-1',
      slots: [
        { playerId: 'player-1' },
        { playerId: 'player-2' },
        { slotNumber: 4, playerId: null },
      ],
    },
    repository,
  );

  assert.deepEqual(lineup, [
    {
      round_id: 'round-1',
      team_id: 'team-1',
      slot_number: 1,
      player_id: 'player-1',
      participation_type: 'roster',
    },
    {
      round_id: 'round-1',
      team_id: 'team-1',
      slot_number: 2,
      player_id: 'player-2',
      participation_type: 'roster',
    },
    {
      round_id: 'round-1',
      team_id: 'team-1',
      slot_number: 4,
      player_id: null,
      participation_type: 'forfeit',
    },
  ]);
  assert.deepEqual(repository.calls, [
    ['submitTeamLineup', {
      actorUserId: 'captain-user-1',
      teamId: 'team-1',
      roundId: 'round-1',
      slots: [
        { slotNumber: 1, playerId: 'player-1' },
        { slotNumber: 2, playerId: 'player-2' },
        { slotNumber: 4, playerId: null },
      ],
    }],
  ]);
});

test('submit lineup command rejects invalid slot input before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => submitTeamLineupCommand(
      {
        actorUserId: 'captain-user-1',
        teamId: 'team-1',
        roundId: 'round-1',
        slots: [{ slotNumber: 5, playerId: 'player-1' }],
      },
      repository,
    ),
    /between 1 and 4/,
  );
  await assert.rejects(
    () => submitTeamLineupCommand(
      {
        actorUserId: 'captain-user-1',
        teamId: 'team-1',
        roundId: 'round-1',
        slots: [{}, {}, {}, {}, {}],
      },
      repository,
    ),
    /more than four slots/,
  );
  assert.deepEqual(repository.calls, []);
});
