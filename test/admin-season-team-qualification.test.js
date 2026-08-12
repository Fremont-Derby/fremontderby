import assert from 'node:assert/strict';
import test from 'node:test';

import { addAdminSeasonTeamCommand } from '../src/adminSeasonTeamsCommands.js';
import {
  deriveAdminSeasonTeamEntry,
  INITIAL_TEAM_ROSTER_MINIMUM,
} from '../src/adminSeasonTeamEntry.js';

const registrationWithSlots = { counts: { availableSlots: 2 } };
const fullRegistration = { counts: { availableSlots: 0 } };

test('initial team slot qualification requires captain plus three current-season players', () => {
  assert.equal(INITIAL_TEAM_ROSTER_MINIMUM, 3);

  const noCaptain = deriveAdminSeasonTeamEntry({
    candidate_kind: 'new',
    active_roster_count: 3,
    captain_player_id: null,
  }, registrationWithSlots);
  assert.equal(noCaptain.entryStatus, 'forming');
  assert.equal(noCaptain.qualified, false);
  assert.match(noCaptain.reason, /assign a captain/i);

  const shortRoster = deriveAdminSeasonTeamEntry({
    candidate_kind: 'new',
    active_roster_count: 2,
    captain_player_id: 'captain-1',
  }, registrationWithSlots);
  assert.equal(shortRoster.entryStatus, 'forming');
  assert.equal(shortRoster.qualified, false);
  assert.match(shortRoster.reason, /add 1 more rostered player/i);

  const qualified = deriveAdminSeasonTeamEntry({
    candidate_kind: 'new',
    active_roster_count: 3,
    captain_player_id: 'captain-1',
  }, registrationWithSlots);
  assert.equal(qualified.entryStatus, 'qualified');
  assert.equal(qualified.qualified, true);
  assert.equal(qualified.canTakeSlot, true);
});

test('qualified team becomes waitlisted when all eight slots are occupied', () => {
  const state = deriveAdminSeasonTeamEntry({
    candidate_kind: 'new',
    active_roster_count: 4,
    captain_player_id: 'captain-1',
  }, fullRegistration);
  assert.equal(state.entryStatus, 'waitlisted');
  assert.equal(state.qualified, true);
  assert.equal(state.canTakeSlot, false);
  assert.match(state.reason, /season is full/i);
});

test('returning team historical roster never counts as current-season qualification', () => {
  const state = deriveAdminSeasonTeamEntry({
    candidate_kind: 'returning',
    active_roster_count: 9,
    captain_player_id: 'last-season-captain',
  }, registrationWithSlots);
  assert.equal(state.entryStatus, 'forming');
  assert.equal(state.qualified, false);
  assert.equal(state.canTakeSlot, true);
  assert.match(state.reason, /returning priority/i);
  assert.match(state.reason, /reserve a slot/i);
});

test('secured season slot is Accepted while current-season roster readiness stays visible', () => {
  const needsCaptain = deriveAdminSeasonTeamEntry({
    candidate_kind: 'in_season',
    active_roster_count: 3,
    captain_player_id: null,
  }, fullRegistration);
  assert.equal(needsCaptain.entryStatus, 'accepted');
  assert.equal(needsCaptain.qualified, false);
  assert.match(needsCaptain.reason, /Accepted .* assign a current-season captain/i);

  const ready = deriveAdminSeasonTeamEntry({
    candidate_kind: 'in_season',
    active_roster_count: 3,
    captain_player_id: 'captain-1',
  }, fullRegistration);
  assert.equal(ready.entryStatus, 'accepted');
  assert.equal(ready.qualified, true);
  assert.match(ready.reason, /initial roster qualified/i);
});

test('server command blocks a Forming new team before the capacity mutation', async () => {
  let addCalled = false;
  const repository = {
    async list() {
      return {
        teams: [{
          candidate_kind: 'new',
          team_id: 'team-1',
          qualified_for_slot: false,
          entry_reason: 'Forming · assign a captain · add 2 more rostered players',
        }],
      };
    },
    async add() { addCalled = true; },
  };

  await assert.rejects(
    () => addAdminSeasonTeamCommand({
      actorUserId: 'admin-1',
      seasonId: 'season-1',
      teamId: 'team-1',
    }, repository),
    /must be qualified.*assign a captain/i,
  );
  assert.equal(addCalled, false);
});

test('server command allows returning priority reservation without crediting the old roster', async () => {
  const calls = [];
  const repository = {
    async list() {
      return {
        teams: [{
          candidate_kind: 'returning',
          team_id: 'team-old',
          qualified_for_slot: false,
        }],
      };
    },
    async add(input) {
      calls.push(input);
      return { team_id: 'team-new', slot_status: 'approved_pending_roster' };
    },
  };

  const result = await addAdminSeasonTeamCommand({
    actorUserId: 'admin-1',
    seasonId: 'season-1',
    teamId: 'team-old',
  }, repository);
  assert.equal(result.team_id, 'team-new');
  assert.equal(calls.length, 1);
});
