import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrizeRepository } from '../src/prizeRepository.js';

const env = {
  SUPABASE_URL: 'https://project.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('prize repository loads the aggregate prize summary read model', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{
      season_id: 'season-1',
      player_count: 32,
      paid_amount_cents: 120000,
      projected_payouts: [],
      finalized_payouts: [],
    }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const repository = createPrizeRepository(env, { fetch });
  const summary = await repository.getSeasonPrizeSummary({ seasonId: 'season-1' });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/get_season_prize_summary');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    target_season_id: 'season-1',
  });
  assert.equal(summary.player_count, 32);
});

test('prize repository configures season prizes through the admin RPC', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{
      season_id: 'season-1',
      version: 2,
      projected_prize_pool_cents: 150000,
    }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const repository = createPrizeRepository(env, { fetch });
  const configuration = await repository.configureSeasonPrizes({
    actorUserId: 'admin-user-1',
    seasonId: 'season-1',
    entryFeeCents: 5000,
    administrationAmountCents: 10000,
    teamAllocationBasisPoints: 6000,
    individualAllocationBasisPoints: 4000,
    projectedFieldSize: 32,
    payoutTemplates: [{ pool: 'team', place: 1, allocationBasisPoints: 10000 }],
  });

  assert.equal(configuration.version, 2);
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/configure_season_prizes');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'admin-user-1',
    target_season_id: 'season-1',
    configured_entry_fee_cents: 5000,
    configured_administration_amount_cents: 10000,
    configured_team_allocation_basis_points: 6000,
    configured_individual_allocation_basis_points: 4000,
    configured_projected_field_size: 32,
    payout_templates: [{ pool: 'team', place: 1, allocationBasisPoints: 10000 }],
  });
});

test('prize repository finalizes season payouts through the immutable payout RPC', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{
      season_id: 'season-1',
      pool: 'team',
      place: 1,
      amount_cents: 100000,
    }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const repository = createPrizeRepository(env, { fetch });
  const payouts = await repository.finalizeSeasonPrizePayouts({
    actorUserId: 'admin-user-1',
    seasonId: 'season-1',
    finalizedPayouts: [{ pool: 'team', place: 1, label: 'Winner', amountCents: 100000 }],
  });

  assert.equal(payouts[0].pool, 'team');
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/finalize_season_prize_payouts');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'admin-user-1',
    target_season_id: 'season-1',
    finalized_payouts: [{ pool: 'team', place: 1, label: 'Winner', amountCents: 100000 }],
  });
});

test('prize repository surfaces Supabase failures', async () => {
  const fetch = async () => new Response(
    JSON.stringify({ message: 'Actor is not a league admin' }),
    {
      status: 400,
      headers: { 'content-type': 'application/json' },
    },
  );
  const repository = createPrizeRepository(env, { fetch });

  await assert.rejects(
    () => repository.configureSeasonPrizes({
      actorUserId: 'player-user-1',
      seasonId: 'season-1',
      entryFeeCents: 5000,
      administrationAmountCents: 0,
      teamAllocationBasisPoints: 6000,
      individualAllocationBasisPoints: 4000,
      projectedFieldSize: 32,
      payoutTemplates: [],
    }),
    /Actor is not a league admin/,
  );
});
