import assert from 'node:assert/strict';
import test from 'node:test';

import {
  configureSeasonRegistrationCommand,
  manageTeamSlotCommand,
  respondToReturningTeamSlotCommand,
  submitTeamApplicationCommand,
} from '../src/teamRegistrationCommands.js';
import { createTeamRegistrationRepository } from '../src/teamRegistrationRepository.js';
import { createStandingsRepository } from '../src/standingsRepository.js';

const env = {
  SUPABASE_URL: 'https://example.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('team application command trims names and delegates', async () => {
  const calls = [];
  const repository = {
    submitApplication(input) {
      calls.push(input);
      return { id: 'application-id' };
    },
  };
  const result = await submitTeamApplicationCommand(
    { actorUserId: 'user-id', seasonId: 'season-id', teamName: '  Breakers  ' },
    repository,
  );
  assert.deepEqual(result, { id: 'application-id' });
  assert.equal(calls[0].teamName, 'Breakers');
});

test('registration commands enforce workflow input', () => {
  assert.throws(
    () => respondToReturningTeamSlotCommand(
      { actorUserId: 'user-id', slotId: 'slot-id', action: 'transfer' },
      { respondToReturningSlot() {} },
    ),
    /transferPlayerId is required/,
  );
  assert.throws(
    () => configureSeasonRegistrationCommand(
      {
        actorUserId: 'user-id',
        seasonId: 'season-id',
        teamCapacity: 1,
        minimumCommittedRoster: 3,
        conditionalHoldDays: 14,
      },
      { configure() {} },
    ),
    /teamCapacity must be between 2 and 32/,
  );
  assert.throws(
    () => manageTeamSlotCommand(
      { actorUserId: 'user-id', slotId: 'slot-id', action: 'release', reason: ' ' },
      { manageSlot() {} },
    ),
    /reason is required/,
  );
});

test('team registration repository unwraps registration JSON', async () => {
  const requests = [];
  const repository = createTeamRegistrationRepository(env, {
    fetch: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse([{ registration: { teamCapacity: 8, applications: [] } }]);
    },
  });
  const registration = await repository.getOwn({
    actorUserId: 'user-id',
    seasonId: 'season-id',
  });
  assert.deepEqual(registration, { teamCapacity: 8, applications: [] });
  assert.match(requests[0].url, /\/rpc\/get_own_team_registration$/);
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    actor_user_id: 'user-id',
    target_season_id: 'season-id',
  });
});

test('public season listing uses registration counts RPC', async () => {
  const requests = [];
  const repository = createStandingsRepository(env, {
    fetch: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse([{
        id: 'season-id',
        name: 'Season 1',
        status: 'registration',
        team_capacity: 8,
        minimum_committed_roster: 3,
        team_count: 1,
        confirmed_team_count: 0,
        occupied_slots: 2,
        open_team_slots: 6,
        reserved_returning_slots: 1,
        held_team_slots: 1,
        applications_waiting: 4,
        rostered_player_count: 2,
        registered_player_count: 5,
        free_agent_count: 3,
        open_primary_roster_spots: 6,
        at_risk_team_count: 0,
      }]);
    },
  });
  const seasons = await repository.listPublicSeasons();
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /\/rpc\/list_public_season_registration$/);
  assert.equal(seasons[0].occupiedSlots, 2);
  assert.equal(seasons[0].applicationsWaiting, 4);
  assert.equal(seasons[0].openPrimaryRosterSpots, 6);
  assert.equal(seasons[0].minimumCommittedRoster, 3);
});
