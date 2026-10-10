import test from 'node:test';
import assert from 'node:assert/strict';
import {
  proposeTeamTradeCommand,
  adminProposeTeamTradeExceptionCommand,
  respondToTeamTradePlayerCommand,
  approveTeamTradeCaptainCommand,
  cancelTeamInvitationCommand,
  removeTeamMemberCommand,
  listOwnTeamTradesCommand,
} from '../src/teamCommands.js';
import { submitTeamLineupCommand, listVisibleTeamLineupsCommand } from '../src/lineupCommands.js';
import {
  getSeasonPrizeSummaryCommand,
  configureSeasonPrizesCommand,
  finalizeSeasonPrizePayoutsCommand,
} from '../src/prizeCommands.js';

function teamRepo() {
  const repo = {
    async proposeTeamTrade(input) { return input; },
    async adminProposeTeamTradeException(input) { return input; },
    async respondToTeamTradePlayer(input) { return input; },
    async approveTeamTradeCaptain(input) { return input; },
    async cancelTeamInvitation(input) { return input; },
    async removeTeamMember(input) { return input; },
    async listOwnTeamTrades(input) { return { ...input, trades: [] }; },
  };
  return repo;
}
function lineupRepo() {
  return {
    async submitTeamLineup(input) { return input; },
    async listVisibleTeamLineups(input) { return { ...input, lineups: [] }; },
  };
}
function prizeRepo(summary = { seasonId: 's1' }) {
  const repo = {
    async getSeasonPrizeSummary() { return summary; },
    async configureSeasonPrizes(input) { repo.last = input; return input; },
    async finalizeSeasonPrizePayouts(input) { repo.last = input; return input; },
  };
  return repo;
}

const trade = { actorUserId: 'cap', teamId: 't1', offeredPlayerId: 'p1', requestedTeamId: 't2', requestedPlayerId: 'p2' };
for (const missing of ['actorUserId', 'teamId', 'offeredPlayerId', 'requestedTeamId', 'requestedPlayerId']) {
  test('a trade without ' + missing + ' is rejected', async () => {
    const input = { ...trade };
    delete input[missing];
    await assert.rejects(() => proposeTeamTradeCommand(input, teamRepo()), new RegExp(missing));
    await assert.rejects(() => adminProposeTeamTradeExceptionCommand(input, teamRepo()), new RegExp(missing));
  });
}
test('a trade stores both sides', async () => {
  const result = await proposeTeamTradeCommand(trade, teamRepo());
  assert.equal(result.offeredPlayerId, 'p1');
  assert.equal(result.requestedPlayerId, 'p2');
});

for (const response of ['accepted', 'declined']) {
  test('a traded player can say ' + response, async () => {
    const result = await respondToTeamTradePlayerCommand({ actorUserId: 'p1', tradeId: 'tr1', response }, teamRepo());
    assert.equal(result.response, response);
  });
}
for (const response of ['approved', 'declined']) {
  test('a captain can mark a trade ' + response, async () => {
    const result = await approveTeamTradeCaptainCommand({ actorUserId: 'cap', tradeId: 'tr1', response }, teamRepo());
    assert.equal(result.response, response);
  });
}
for (const bad of ['maybe', '', null]) {
  test('player trade response ' + JSON.stringify(bad) + ' is rejected', async () => {
    await assert.rejects(
      () => respondToTeamTradePlayerCommand({ actorUserId: 'p1', tradeId: 'tr1', response: bad }, teamRepo()),
      /accepted or declined/,
    );
  });
  test('captain trade response ' + JSON.stringify(bad) + ' is rejected', async () => {
    await assert.rejects(
      () => approveTeamTradeCaptainCommand({ actorUserId: 'cap', tradeId: 'tr1', response: bad }, teamRepo()),
      /approved or declined/,
    );
  });
}
test('canceling an invitation requires the invitation', async () => {
  await assert.rejects(() => cancelTeamInvitationCommand({ actorUserId: 'cap' }, teamRepo()), /invitationId/);
  const result = await cancelTeamInvitationCommand({ actorUserId: 'cap', invitationId: 'i1' }, teamRepo());
  assert.equal(result.invitationId, 'i1');
});
test('removing a member requires the membership', async () => {
  await assert.rejects(() => removeTeamMemberCommand({ actorUserId: 'cap' }, teamRepo()), /membershipId/);
});
test('listing trades requires an actor', async () => {
  await assert.rejects(() => listOwnTeamTradesCommand({}, teamRepo()), /actorUserId/);
  const result = await listOwnTeamTradesCommand({ actorUserId: 'cap' }, teamRepo());
  assert.deepEqual(result.trades, []);
});

const goodSlots = [[{ slotNumber: 1, playerId: 'p1' }], [{ slotNumber: 1, playerId: 'p1' }, { slotNumber: 2, playerId: 'p2' }, { slotNumber: 3, playerId: 'p3' }]];
for (const slots of goodSlots) {
  test('a lineup of ' + slots.length + ' is accepted', async () => {
    const result = await submitTeamLineupCommand({ actorUserId: 'cap', teamId: 't1', roundId: 'r1', slots }, lineupRepo());
    assert.equal(result.slots.length, slots.length);
  });
}
for (const slots of [null, 'nope', { slotNumber: 1 }, [1, 2, 3, 4]]) {
  test('lineup slots ' + JSON.stringify(slots) + ' are rejected', async () => {
    await assert.rejects(
      () => submitTeamLineupCommand({ actorUserId: 'cap', teamId: 't1', roundId: 'r1', slots }, lineupRepo()),
      /slots|three|object/,
    );
  });
}
test('a lineup slot number outside 1 to 3 is rejected', async () => {
  await assert.rejects(
    () => submitTeamLineupCommand({ actorUserId: 'cap', teamId: 't1', roundId: 'r1', slots: [{ slotNumber: 4, playerId: 'p1' }] }, lineupRepo()),
    /between 1 and 3/,
  );
});
test('listing lineups requires the team and the round', async () => {
  await assert.rejects(() => listVisibleTeamLineupsCommand({ actorUserId: 'cap', roundId: 'r1' }, lineupRepo()), /teamId/);
  await assert.rejects(() => listVisibleTeamLineupsCommand({ actorUserId: 'cap', teamId: 't1' }, lineupRepo()), /roundId/);
});

const templates = [
  { pool: 'team', place: 1, label: 'First', allocationBasisPoints: 10000 },
  { pool: 'individual', place: 1, label: 'First', allocationBasisPoints: 10000 },
];
const prizeBase = {
  actorUserId: 'admin', seasonId: 's1', entryFeeCents: 2000, administrationAmountCents: 0,
  teamAllocationBasisPoints: 6000, individualAllocationBasisPoints: 4000, projectedFieldSize: 8,
  payoutTemplates: templates,
};
test('a balanced prize setup is stored', async () => {
  const result = await configureSeasonPrizesCommand(prizeBase, prizeRepo());
  assert.equal(result.teamAllocationBasisPoints, 6000);
  assert.equal(result.payoutTemplates.length, 2);
});
for (const [label, override, pattern] of [
  ['no actor', { actorUserId: '' }, /actorUserId/],
  ['no season', { seasonId: '' }, /seasonId/],
  ['split that is not 10000', { teamAllocationBasisPoints: 5000, individualAllocationBasisPoints: 4000 }, /total 10000/],
  ['admin fee over the gross', { administrationAmountCents: 999999 }, /cannot exceed/],
  ['templates that are not an array', { payoutTemplates: null }, /payoutTemplates/],
]) {
  test('prize setup rejects ' + label, async () => {
    await assert.rejects(() => configureSeasonPrizesCommand({ ...prizeBase, ...override }, prizeRepo()), pattern);
  });
}
test('a missing season summary is rejected', async () => {
  await assert.rejects(() => getSeasonPrizeSummaryCommand({ seasonId: 's1' }, prizeRepo(null)), /Season not found/);
});
test('finalizing payouts requires an actor and a season', async () => {
  await assert.rejects(() => finalizeSeasonPrizePayoutsCommand({ seasonId: 's1', finalizedPayouts: [] }, prizeRepo()), /actorUserId/);
  await assert.rejects(() => finalizeSeasonPrizePayoutsCommand({ actorUserId: 'admin', finalizedPayouts: [] }, prizeRepo()), /seasonId/);
});
test('a finalized payout must be an object', async () => {
  await assert.rejects(
    () => finalizeSeasonPrizePayoutsCommand({ actorUserId: 'admin', seasonId: 's1', finalizedPayouts: ['nope'] }, prizeRepo()),
    /object/,
  );
});
