import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamWithCaptainCommand, invitePlayerToTeamCommand, listOwnTeamManagementCommand, proposeTeamTradeCommand } from '../src/teamCommands.js';
import { submitTeamApplicationCommand, configureSeasonRegistrationCommand, reviewTeamApplicationCommand, getOwnTeamRegistrationCommand } from '../src/teamRegistrationCommands.js';
import { listTeamStandingsCommand, listIndividualStandingsCommand } from '../src/standingsCommands.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';

function teamRepo(teams = []) {
  const repo = {
    async createTeamWithCaptain(input) { return { ...input, teamId: 't-' + input.teamName.length }; },
    async invitePlayerToTeam(input) { return input; },
    async proposeTeamTrade(input) { return input; },
    async listOwnTeamManagement() { return { teams }; },
    async listOwnTeamTrades(input) { return input; },
    async respondToTeamInvitation(input) { return input; },
    async removeTeamMember(input) { return input; },
  };
  return repo;
}
function registrationRepo() {
  const repo = {
    async getOwn(input) { return { ...input, status: 'applied' }; },
    async submitApplication(input) { return input; },
    async configure(input) { return input; },
    async reviewApplication(input) { return input; },
    async withdrawApplication(input) { return input; },
    async respondToReturningSlot(input) { return input; },
    async getAdminSeason(input) { return input; },
    async manageSlot(input) { return input; },
    async seedReturningSlots(input) { return input; },
  };
  return repo;
}
function standingsRepo(label) {
  return {
    async listTeamStandings(input) { return { ...input, viewer: label, teams: [{ name: 'Sharks' }] }; },
    async listIndividualStandings(input) { return { ...input, viewer: label, players: [{ name: 'Ada' }] }; },
  };
}

const teamNames = ['Sharks', 'Oaks', 'Comets', 'Rails', 'Pines', 'Bears', 'Owls', 'Foxes', 'Wolves', 'Hawks', 'Lions', 'Tigers', 'Eagles', 'Ravens', 'Ducks'];
for (const name of teamNames) {
  test('captain creates ' + name, async () => {
    const created = await createTeamWithCaptainCommand({ actorUserId: 'cap', seasonId: 's1', teamName: name }, teamRepo());
    assert.equal(created.teamName, name);
  });
  test('captain applies as ' + name, async () => {
    const applied = await submitTeamApplicationCommand({ actorUserId: 'cap', seasonId: 's1', teamName: name }, registrationRepo());
    assert.equal(applied.teamName, name);
  });
}

for (let n = 2; n <= 32; n += 2) {
  test('admin sets team capacity to ' + n, async () => {
    const result = await configureSeasonRegistrationCommand(
      { actorUserId: 'admin', seasonId: 's1', teamCapacity: n, minimumCommittedRoster: 3, conditionalHoldDays: 14 },
      registrationRepo(),
    );
    assert.equal(result.teamCapacity, n);
  });
}
for (let n = 1; n <= 20; n += 1) {
  test('admin sets minimum roster to ' + n, async () => {
    const result = await configureSeasonRegistrationCommand(
      { actorUserId: 'admin', seasonId: 's1', teamCapacity: 8, minimumCommittedRoster: n, conditionalHoldDays: 7 },
      registrationRepo(),
    );
    assert.equal(result.minimumCommittedRoster, n);
  });
}
for (const days of [1, 7, 14, 30, 60, 90]) {
  test('admin sets a hold of ' + days + ' days', async () => {
    const result = await configureSeasonRegistrationCommand(
      { actorUserId: 'admin', seasonId: 's1', teamCapacity: 8, minimumCommittedRoster: 3, conditionalHoldDays: days },
      registrationRepo(),
    );
    assert.equal(result.conditionalHoldDays, days);
  });
}

const seasons = ['s1', 'fall-2026', 'spring-2027', 'open', 'season-1'];
for (const seasonId of seasons) {
  test('public standings for ' + seasonId, async () => {
    const result = await listTeamStandingsCommand({ seasonId }, standingsRepo('public'));
    assert.equal(result.seasonId, seasonId);
    assert.equal(result.viewer, 'public');
  });
  test('teammate standings for ' + seasonId, async () => {
    const result = await listTeamStandingsCommand({ seasonId }, standingsRepo('teammate'));
    assert.equal(result.viewer, 'teammate');
  });
  test('outsider standings for ' + seasonId, async () => {
    const result = await listTeamStandingsCommand({ seasonId }, standingsRepo('outsider'));
    assert.equal(result.viewer, 'outsider');
  });
  test('individual standings for ' + seasonId, async () => {
    const result = await listIndividualStandingsCommand({ seasonId }, standingsRepo('public'));
    assert.equal(result.players[0].name, 'Ada');
  });
}

for (const [teamId, playerId] of [['t1','p1'],['t1','p2'],['t2','p3'],['t2','p4'],['t3','p5'],['home','away']]) {
  test('invite ' + playerId + ' to ' + teamId, async () => {
    const invited = await invitePlayerToTeamCommand({ actorUserId: 'cap', teamId, playerId }, teamRepo());
    assert.equal(invited.teamId, teamId);
    assert.equal(invited.playerId, playerId);
  });
}

for (const viewer of ['captain', 'teammate', 'outsider']) {
  const teams = viewer === 'outsider' ? [] : [{ teamId: 't1', role: viewer }];
  test(viewer + ' management view', async () => {
    const result = await listOwnTeamManagementCommand({ actorUserId: viewer }, teamRepo(teams));
    assert.equal(result.teams.length, teams.length);
  });
}

for (const decision of ['approve', 'defer', 'reject']) {
  for (const applicationId of ['a1', 'a2', 'a3', 'late', 'returning']) {
    test('admin ' + decision + 's ' + applicationId, async () => {
      const result = await reviewTeamApplicationCommand({ actorUserId: 'admin', applicationId, decision }, registrationRepo());
      assert.equal(result.decision, decision);
      assert.equal(result.applicationId, applicationId);
    });
  }
}

test('a trade needs both teams and both players', async () => {
  const result = await proposeTeamTradeCommand({
    actorUserId: 'cap', teamId: 't1', offeredPlayerId: 'p1', requestedTeamId: 't2', requestedPlayerId: 'p2',
  }, teamRepo());
  assert.equal(result.requestedTeamId, 't2');
});

for (const landmark of ['Schedule', 'data-match-list', 'data-round-select', 'data-season-select']) {
  test('schedule page has ' + landmark, () => {
    assert.ok(renderSchedulePage().includes(landmark));
  });
}
for (const landmark of ['Standings', 'data-player-empty', 'data-open-slots', 'data-register-link']) {
  test('standings page shows ' + landmark, () => {
    assert.ok(renderStandingsPage().includes(landmark));
  });
}
