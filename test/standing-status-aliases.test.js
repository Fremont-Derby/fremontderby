import test from 'node:test';
import assert from 'node:assert/strict';
import { saveOwnStandingAvailabilityCommand } from '../src/playerProfileCommands.js';

test('maps available shorthand to available_for_subs', async () => {
  const calls = [];
  await saveOwnStandingAvailabilityCommand(
    { actorUserId: 'u1', standingStatus: 'available', standingNote: 'n' },
    {
      async saveStandingAvailability(args) {
        calls.push(args);
        return { standing_availability_status: args.standingStatus };
      },
    },
  );
  assert.equal(calls[0].standingStatus, 'available_for_subs');
});
