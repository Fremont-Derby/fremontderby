import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamWithCaptainCommand, invitePlayerToTeamCommand, respondToTeamInvitationCommand, removeTeamMemberCommand } from '../src/teamCommands.js';
import { configureSeasonRegistrationCommand, manageTeamSlotCommand, withdrawTeamApplicationCommand, getOwnTeamRegistrationCommand } from '../src/teamRegistrationCommands.js';
import { listTeamStandingsCommand } from '../src/standingsCommands.js';
import { chooseTeamMatchTeamCommand, listMyTeamMatchChoicesCommand } from '../src/teamMatchChoiceCommands.js';

function teamRepo() {
  return {
    async createTeamWithCaptain(input) { return input; },
    async invitePlayerToTeam(input) { return input; },
    async respondToTeamInvitation(input) { return input; },
    async removeTeamMember(input) { return input; },
    async listOwnTeamManagement(input) { return input; },
    async listOwnTeamTrades(input) { return input; },
    async proposeTeamTrade(input) { return input; },
  };
}
function registrationRepo() {
  return {
    async configure(input) { return input; },
    async manageSlot(input) { return input; },
    async withdrawApplication(input) { return input; },
    async getOwn(input) { return { ...input, applicationStatus: 'pending' }; },
    async submitApplication(input) { return input; },
    async reviewApplication(input) { return input; },
    async respondToReturningSlot(input) { return input; },
    async getAdminSeason(input) { return input; },
    async seedReturningSlots(input) { return input; },
  };
}
function standingsRepo() {
  return { async listTeamStandings(input) { return { ...input, teams: [] }; } };
}
function choiceRepo() {
  return {
    async chooseTeamMatchTeam(input) { return input; },
    async listMyTeamMatchChoices(input) { return { ...input, choices: [] }; },
  };
}

for (let n = 1; n <= 40; n += 1) {
  const name = 'Team ' + n;
  test('create team ' + n, async () => {
    const created = await createTeamWithCaptainCommand({ actorUserId: 'cap-' + n, seasonId: 's1', teamName: name }, teamRepo());
    assert.equal(created.teamName, name);
    assert.equal(created.actorUserId, 'cap-' + n);
  });
}

for (let n = 1; n <= 30; n += 1) {
  test('invite player ' + n, async () => {
    const invited = await invitePlayerToTeamCommand({ actorUserId: 'cap', teamId: 't1', playerId: 'p' + n }, teamRepo());
    assert.equal(invited.playerId, 'p' + n);
  });
}

for (const response of ['accepted', 'declined']) {
  for (let n = 1; n <= 10; n += 1) {
    test('invitation ' + n + ' is ' + response, async () => {
      const result = await respondToTeamInvitationCommand({ actorUserId: 'p' + n, invitationId: 'i' + n, response }, teamRepo());
      assert.equal(result.response, response);
      assert.equal(result.invitationId, 'i' + n);
    });
  }
}

for (const days of [1, 2, 3, 5, 10, 15, 21, 45, 90]) {
  test('extend a slot by ' + days + ' days', async () => {
    const result = await manageTeamSlotCommand(
      { actorUserId: 'admin', slotId: 'slot1', action: 'extend', reason: 'weather', extensionDays: days },
      registrationRepo(),
    );
    assert.equal(result.extensionDays, days);
  });
}

for (const bad of [0, 91, -1]) {
  test('extension of ' + bad + ' days is rejected', async () => {
    assert.throws(
      () => manageTeamSlotCommand(
        { actorUserId: 'admin', slotId: 'slot1', action: 'extend', reason: 'weather', extensionDays: bad },
        registrationRepo(),
      ),
      /extensionDays/,
    );
  });
}

for (const seasonId of ['s1', 's2', 'fall', 'spring', 'open']) {
  test('own registration for ' + seasonId, async () => {
    const result = await getOwnTeamRegistrationCommand({ actorUserId: 'cap', seasonId }, registrationRepo());
    assert.equal(result.seasonId, seasonId);
    assert.equal(result.applicationStatus, 'pending');
  });
  test('public standings are empty for a new season ' + seasonId, async () => {
    const result = await listTeamStandingsCommand({ seasonId }, standingsRepo());
    assert.deepEqual(result.teams, []);
  });
}

for (let n = 1; n <= 15; n += 1) {
  test('player ' + n + ' can choose their team for a match', async () => {
    const chosen = await chooseTeamMatchTeamCommand({ actorUserId: 'p' + n, teamMatchId: 'm1', teamId: 't1' }, choiceRepo());
    assert.equal(chosen.actorUserId, 'p' + n);
    assert.equal(chosen.teamId, 't1');
  });
  test('player ' + n + ' with no match choice gets an empty list', async () => {
    const result = await listMyTeamMatchChoicesCommand({ actorUserId: 'p' + n }, choiceRepo());
    assert.deepEqual(result.choices, []);
  });
}

for (let n = 1; n <= 10; n += 1) {
  test('remove membership ' + n, async () => {
    const result = await removeTeamMemberCommand({ actorUserId: 'cap', membershipId: 'mem-' + n }, teamRepo());
    assert.equal(result.membershipId, 'mem-' + n);
  });
}

for (let n = 1; n <= 8; n += 1) {
  test('withdraw application ' + n, async () => {
    const result = await withdrawTeamApplicationCommand({ actorUserId: 'cap', applicationId: 'app-' + n }, registrationRepo());
    assert.equal(result.applicationId, 'app-' + n);
  });
}
