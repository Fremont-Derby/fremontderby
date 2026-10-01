import test from 'node:test';
import assert from 'node:assert/strict';
import { saveOwnStandingAvailabilityCommand } from '../src/playerProfileCommands.js';

function mockRepo(calls) {
  return {
    async getProfileByUserId() {
      return { id: 'p1' };
    },
    async saveProfile() {
      return {};
    },
    async saveStandingAvailability(args) {
      calls.push(args);
      return { standing_availability_status: args.standingStatus };
    },
  };
}

test('maps available shorthand to available_for_subs', async () => {
  const calls = [];
  await saveOwnStandingAvailabilityCommand(
    { actorUserId: 'u1', standingStatus: 'available', standingNote: 'n' },
    mockRepo(calls),
  );
  assert.equal(calls[0].standingStatus, 'available_for_subs');
});

test('maps no/out to unavailable', async () => {
  const calls = [];
  await saveOwnStandingAvailabilityCommand(
    { actorUserId: 'u1', standingStatus: 'no' },
    mockRepo(calls),
  );
  assert.equal(calls[0].standingStatus, 'unavailable');
});
