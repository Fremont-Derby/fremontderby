import test from 'node:test';
import assert from 'node:assert/strict';
import {
  configureSeasonPrizesCommand,
  finalizeSeasonPrizePayoutsCommand,
  getSeasonPrizeSummaryCommand,
} from '../src/prizeCommands.js';

const payoutTemplates = [
  { pool: 'team', place: 1, label: 'Team champion', allocationBasisPoints: 7000 },
  { pool: 'team', place: 2, label: 'Team runner-up', allocationBasisPoints: 3000 },
  { pool: 'individual', place: 1, label: 'Individual champion', allocationBasisPoints: 10000 },
];

test('prize summary command loads the aggregate season prize read model', async () => {
  const calls = [];
  const repository = {
    async getSeasonPrizeSummary(payload) {
      calls.push(payload);
      return {
        season_id: payload.seasonId,
        player_count: 32,
        projected_prize_pool_cents: 150000,
      };
    },
  };

  const summary = await getSeasonPrizeSummaryCommand(
    { seasonId: 'season-1' },
    repository,
  );

  assert.equal(summary.player_count, 32);
  assert.deepEqual(calls, [{ seasonId: 'season-1' }]);
});

test('prize summary command treats a missing season read as not found', async () => {
  const repository = { getSeasonPrizeSummary: async () => null };

  const summary = await getSeasonPrizeSummaryCommand({ seasonId: 'missing-season' }, repository);
  assert.equal(summary.season_id, 'missing-season');
  assert.equal(summary.player_count, 0);
  assert.equal(summary.unconfigured, true);
});

test('configure prizes command validates and normalizes allocation input', async () => {
  const calls = [];
  const repository = {
    async configureSeasonPrizes(payload) {
      calls.push(payload);
      return { season_id: payload.seasonId, version: 1 };
    },
  };

  const configuration = await configureSeasonPrizesCommand(
    {
      actorUserId: 'admin-user-1',
      seasonId: 'season-1',
      entryFeeCents: '5000',
      administrationAmountCents: 10000,
      teamAllocationBasisPoints: 6000,
      individualAllocationBasisPoints: 4000,
      projectedFieldSize: 32,
      payoutTemplates,
    },
    repository,
  );

  assert.equal(configuration.version, 1);
  assert.deepEqual(calls[0], {
    actorUserId: 'admin-user-1',
    seasonId: 'season-1',
    entryFeeCents: 5000,
    administrationAmountCents: 10000,
    teamAllocationBasisPoints: 6000,
    individualAllocationBasisPoints: 4000,
    projectedFieldSize: 32,
    payoutTemplates,
  });
});

test('configure prizes command requires prize allocations to balance', async () => {
  const repository = { configureSeasonPrizes: async () => ({}) };

  await assert.rejects(
    () => configureSeasonPrizesCommand(
      {
        actorUserId: 'admin-user-1',
        seasonId: 'season-1',
        entryFeeCents: 5000,
        administrationAmountCents: 0,
        teamAllocationBasisPoints: 5000,
        individualAllocationBasisPoints: 4000,
        projectedFieldSize: 32,
        payoutTemplates,
      },
      repository,
    ),
    /prize allocations must total 10000 basis points/,
  );
});

test('configure prizes command requires each pool payout template to total the pool', async () => {
  const repository = { configureSeasonPrizes: async () => ({}) };

  await assert.rejects(
    () => configureSeasonPrizesCommand(
      {
        actorUserId: 'admin-user-1',
        seasonId: 'season-1',
        entryFeeCents: 5000,
        administrationAmountCents: 0,
        teamAllocationBasisPoints: 6000,
        individualAllocationBasisPoints: 4000,
        projectedFieldSize: 32,
        payoutTemplates: [
          { pool: 'team', place: 1, allocationBasisPoints: 9000 },
          { pool: 'individual', place: 1, allocationBasisPoints: 10000 },
        ],
      },
      repository,
    ),
    /team payout templates must total 10000 basis points/,
  );
});

test('finalize prize payouts command validates immutable payout rows', async () => {
  const calls = [];
  const repository = {
    async finalizeSeasonPrizePayouts(payload) {
      calls.push(payload);
      return payload.finalizedPayouts;
    },
  };

  const payouts = await finalizeSeasonPrizePayoutsCommand(
    {
      actorUserId: 'admin-user-1',
      seasonId: 'season-1',
      finalizedPayouts: [
        { pool: 'team', place: 1, amountCents: 100000 },
        { pool: 'individual', place: 1, label: 'Top player', amount_cents: 50000 },
      ],
    },
    repository,
  );

  assert.deepEqual(payouts, [
    { pool: 'team', place: 1, label: 'Place 1', amountCents: 100000 },
    { pool: 'individual', place: 1, label: 'Top player', amountCents: 50000 },
  ]);
  assert.equal(calls[0].actorUserId, 'admin-user-1');
});
