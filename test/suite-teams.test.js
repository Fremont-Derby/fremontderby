import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTeamWithCaptainCommand,
  invitePlayerToTeamCommand,
  proposeTeamTradeCommand,
  respondToTeamInvitationCommand,
  listOwnTeamManagementCommand,
  removeTeamMemberCommand,
} from '../src/teamCommands.js';
import {
  submitTeamApplicationCommand,
  reviewTeamApplicationCommand,
  configureSeasonRegistrationCommand,
  manageTeamSlotCommand,
  respondToReturningTeamSlotCommand,
  withdrawTeamApplicationCommand,
  getOwnTeamRegistrationCommand,
} from '../src/teamRegistrationCommands.js';
import { listTeamStandingsCommand, listIndividualStandingsCommand } from '../src/standingsCommands.js';
import { chooseTeamMatchTeamCommand } from '../src/teamMatchChoiceCommands.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';

function teamRepo() {
  const repo = {
    async createTeamWithCaptain(input) { repo.last = input; return { ...input, teamId: 't1' }; },
    async invitePlayerToTeam(input) { repo.last = input; return input; },
    async proposeTeamTrade(input) { repo.last = input; return input; },
    async respondToTeamInvitation(input) { repo.last = input; return input; },
    async listOwnTeamManagement(input) { return { ...input, teams: repo.teams || [] }; },
    async removeTeamMember(input) { repo.last = input; return input; },
    async listOwnTeamTrades(input) { return input; },
  };
  return repo;
}
function registrationRepo() {
  const repo = {
    async getOwn(input) { return input; },
    async submitApplication(input) { repo.last = input; return { ...input, applicationId: 'a1' }; },
    async withdrawApplication(input) { return input; },
    async respondToReturningSlot(input) { repo.last = input; return input; },
    async getAdminSeason(input) { return input; },
    async configure(input) { repo.last = input; return input; },
    async reviewApplication(input) { repo.last = input; return input; },
    async manageSlot(input) { repo.last = input; return input; },
    async seedReturningSlots(input) { return input; },
  };
  return repo;
}
function standingsRepo(rows = []) {
  return {
    async listTeamStandings(input) { return { ...input, teams: rows }; },
    async listIndividualStandings(input) { return { ...input, players: rows }; },
  };
}
function choiceRepo() {
  const repo = {
    async listMine(input) { return input; },
    async chooseTeamMatchTeam(input) { repo.last = input; return input; },
  };
  return repo;
}

const names = ['Sharks', 'Oaks', 'Comets', '  Sharks  ', 'A', 'A'.repeat(80)];
for (const name of names) {
  test('creating a team keeps ' + JSON.stringify(name).slice(0, 20), async () => {
    const repo = teamRepo();
    const created = await createTeamWithCaptainCommand({ actorUserId: 'cap', seasonId: 's1', teamName: name }, repo);
    assert.equal(created.teamName, name.trim());
    assert.equal(created.teamId, 't1');
  });
  test('applying with ' + JSON.stringify(name).slice(0, 20) + ' stores the trimmed name', async () => {
    const repo = registrationRepo();
    const applied = await submitTeamApplicationCommand({ actorUserId: 'cap', seasonId: 's1', teamName: name }, repo);
    assert.equal(applied.teamName, name.trim());
  });
}

for (const bad of ['', '   ', 'A'.repeat(81), null, 12]) {
  test('team name ' + JSON.stringify(bad) + ' is rejected on create', async () => {
    await assert.rejects(
      () => createTeamWithCaptainCommand({ actorUserId: 'cap', seasonId: 's1', teamName: bad }, teamRepo()),
      /teamName/,
    );
  });
}

test('creating a team requires an actor and a season', async () => {
  await assert.rejects(() => createTeamWithCaptainCommand({ seasonId: 's1', teamName: 'Sharks' }, teamRepo()), /actorUserId/);
  await assert.rejects(() => createTeamWithCaptainCommand({ actorUserId: 'cap', teamName: 'Sharks' }, teamRepo()), /seasonId/);
});

for (const [teamId, playerId] of [['t1', 'p1'], ['t2', 'p9'], ['home', 'guest']]) {
  test('captain of ' + teamId + ' can invite ' + playerId, async () => {
    const invited = await invitePlayerToTeamCommand({ actorUserId: 'cap', teamId, playerId }, teamRepo());
    assert.equal(invited.teamId, teamId);
    assert.equal(invited.playerId, playerId);
  });
}

test('an invite requires a team and a player', async () => {
  await assert.rejects(() => invitePlayerToTeamCommand({ actorUserId: 'cap', playerId: 'p1' }, teamRepo()), /teamId/);
  await assert.rejects(() => invitePlayerToTeamCommand({ actorUserId: 'cap', teamId: 't1' }, teamRepo()), /playerId/);
});

for (const response of ['accepted', 'declined']) {
  test('an invitation can be ' + response, async () => {
    const result = await respondToTeamInvitationCommand({ actorUserId: 'p1', invitationId: 'i1', response }, teamRepo());
    assert.equal(result.response, response);
  });
}
for (const bad of ['maybe', '', null, 'yes']) {
  test('invitation response ' + JSON.stringify(bad) + ' is rejected', async () => {
    await assert.rejects(
      () => respondToTeamInvitationCommand({ actorUserId: 'p1', invitationId: 'i1', response: bad }, teamRepo()),
      /accepted or declined/,
    );
  });
}

for (const decision of ['approve', 'defer', 'reject']) {
  test('an admin can ' + decision + ' a team application', async () => {
    const result = await reviewTeamApplicationCommand({ actorUserId: 'admin', applicationId: 'a1', decision }, registrationRepo());
    assert.equal(result.decision, decision);
  });
}
for (const bad of ['accept', '', null, 'hold']) {
  test('application decision ' + JSON.stringify(bad) + ' is rejected', async () => {
    assert.throws(
      () => reviewTeamApplicationCommand({ actorUserId: 'admin', applicationId: 'a1', decision: bad }, registrationRepo()),
      /approve, defer, or reject/,
    );
  });
}

for (const action of ['confirm', 'release', 'transfer']) {
  test('a returning slot can be ' + action, async () => {
    const input = { actorUserId: 'cap', slotId: 'slot1', action, transferPlayerId: 'p2' };
    const result = await respondToReturningTeamSlotCommand(input, registrationRepo());
    assert.equal(result.action, action);
  });
}
test('a transfer requires the player who receives the slot', async () => {
  assert.throws(
    () => respondToReturningTeamSlotCommand({ actorUserId: 'cap', slotId: 'slot1', action: 'transfer' }, registrationRepo()),
    /transferPlayerId/,
  );
});

for (const action of ['confirm', 'release', 'extend', 'expire']) {
  test('an admin can ' + action + ' a team slot', async () => {
    const result = await manageTeamSlotCommand(
      { actorUserId: 'admin', slotId: 'slot1', action, reason: 'house call', extensionDays: 7 },
      registrationRepo(),
    );
    assert.equal(result.action, action);
  });
}
test('releasing a slot requires a reason', async () => {
  assert.throws(
    () => manageTeamSlotCommand({ actorUserId: 'admin', slotId: 'slot1', action: 'release' }, registrationRepo()),
    /reason/,
  );
});

for (const capacity of [2, 8, 16, 32]) {
  test('a season can hold ' + capacity + ' teams', async () => {
    const result = await configureSeasonRegistrationCommand(
      { actorUserId: 'admin', seasonId: 's1', teamCapacity: capacity, minimumCommittedRoster: 3, conditionalHoldDays: 7 },
      registrationRepo(),
    );
    assert.equal(result.teamCapacity, capacity);
  });
}
for (const bad of [1, 33, 0, -1]) {
  test('team capacity ' + bad + ' is out of range', async () => {
    assert.throws(
      () => configureSeasonRegistrationCommand(
        { actorUserId: 'admin', seasonId: 's1', teamCapacity: bad, minimumCommittedRoster: 3, conditionalHoldDays: 7 },
        registrationRepo(),
      ),
      /teamCapacity/,
    );
  });
}

test('public standings return the teams the repository has', async () => {
  const rows = [{ teamId: 't1', name: 'Sharks' }, { teamId: 't2', name: 'Oaks' }];
  const result = await listTeamStandingsCommand({ seasonId: 's1' }, standingsRepo(rows));
  assert.equal(result.teams.length, 2);
  assert.equal(result.seasonId, 's1');
});
test('standings require a season', async () => {
  await assert.rejects(() => listTeamStandingsCommand({}, standingsRepo()), /seasonId/);
  await assert.rejects(() => listIndividualStandingsCommand({}, standingsRepo()), /seasonId/);
});

test('a player on a team sees that team in management', async () => {
  const repo = teamRepo();
  repo.teams = [{ teamId: 't1', role: 'captain' }];
  const result = await listOwnTeamManagementCommand({ actorUserId: 'cap' }, repo);
  assert.equal(result.teams[0].teamId, 't1');
});
test('a signed-in player on no team gets an empty management list', async () => {
  const result = await listOwnTeamManagementCommand({ actorUserId: 'outsider' }, teamRepo());
  assert.deepEqual(result.teams, []);
});

test('a captain can remove a teammate', async () => {
  const result = await removeTeamMemberCommand({ actorUserId: 'cap', membershipId: 'm2' }, teamRepo());
  assert.equal(result.membershipId, 'm2');
});

test('choosing a side requires the match and the team', async () => {
  await assert.rejects(() => chooseTeamMatchTeamCommand({ actorUserId: 'cap', teamId: 't1' }, choiceRepo()), /teamMatchId/);
  const chosen = await chooseTeamMatchTeamCommand({ actorUserId: 'cap', teamMatchId: 'm1', teamId: 't1' }, choiceRepo());
  assert.equal(chosen.teamId, 't1');
});

for (const landmark of ['Standings', 'data-player-body', 'data-registration-summary', 'data-season-id']) {
  test('standings page has ' + landmark, () => {
    assert.ok(renderStandingsPage().includes(landmark));
  });
}
test('teams page renders', () => {
  const html = renderTeamsPage();
  assert.equal(typeof html, 'string');
  assert.ok(html.length > 40);
});
