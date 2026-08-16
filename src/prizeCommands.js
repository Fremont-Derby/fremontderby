function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`prize repository must implement ${method}`);
  }
}

function normalizeInteger(value, name, { min = 0 } = {}) {
  const number = typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;

  if (!Number.isInteger(number) || number < min) {
    throw new Error(`${name} must be ${min === 0 ? 'zero or greater' : `at least ${min}`}`);
  }

  return number;
}

function normalizePool(value, name) {
  if (value !== 'team' && value !== 'individual') {
    throw new Error(`${name} must be team or individual`);
  }
  return value;
}

function normalizeLabel(value, place) {
  const label = typeof value === 'string' ? value.trim() : '';
  const resolved = label || `Place ${place}`;

  if (resolved.length > 80) {
    throw new Error('payout label must be 80 characters or fewer');
  }

  return resolved;
}

function normalizePayoutTemplates(payoutTemplates) {
  if (!Array.isArray(payoutTemplates)) {
    throw new Error('payoutTemplates must be an array');
  }

  const totals = { team: 0, individual: 0 };
  const normalized = payoutTemplates.map((payout) => {
    if (!payout || typeof payout !== 'object' || Array.isArray(payout)) {
      throw new Error('each payout template must be an object');
    }

    const pool = normalizePool(payout.pool, 'payout pool');
    const place = normalizeInteger(payout.place, 'payout place', { min: 1 });
    const allocationBasisPoints = normalizeInteger(
      payout.allocationBasisPoints ?? payout.allocation_basis_points,
      'payout allocation',
    );

    if (allocationBasisPoints > 10000) {
      throw new Error('payout allocation must be 10000 basis points or fewer');
    }

    totals[pool] += allocationBasisPoints;
    return {
      pool,
      place,
      label: normalizeLabel(payout.label, place),
      allocationBasisPoints,
    };
  });

  if (totals.team !== 10000) {
    throw new Error('team payout templates must total 10000 basis points');
  }
  if (totals.individual !== 10000) {
    throw new Error('individual payout templates must total 10000 basis points');
  }

  return normalized;
}

function normalizeFinalizedPayouts(finalizedPayouts) {
  if (!Array.isArray(finalizedPayouts)) {
    throw new Error('finalizedPayouts must be an array');
  }

  return finalizedPayouts.map((payout) => {
    if (!payout || typeof payout !== 'object' || Array.isArray(payout)) {
      throw new Error('each finalized payout must be an object');
    }

    const pool = normalizePool(payout.pool, 'finalized payout pool');
    const place = normalizeInteger(payout.place, 'finalized payout place', { min: 1 });

    return {
      pool,
      place,
      label: normalizeLabel(payout.label, place),
      amountCents: normalizeInteger(
        payout.amountCents ?? payout.amount_cents,
        'finalized payout amount',
      ),
    };
  });
}

export async function getSeasonPrizeSummaryCommand({ seasonId }, repository) {
  if (!seasonId) {
    throw new Error('seasonId is required');
  }

  assertRepository(repository, 'getSeasonPrizeSummary');
  const summary = await repository.getSeasonPrizeSummary({ seasonId });
  if (!summary) {
    // QA/fixture seasons (purpose != league) return no public prize summary row.
    return {
      season_id: seasonId,
      season_name: null,
      season_status: null,
      player_count: 0,
      paid_amount_cents: 0,
      committed_amount_cents: 0,
      entry_fee_cents: 0,
      administration_amount_cents: 0,
      projected_field_size: 0,
      projected_gross_cents: 0,
      projected_prize_pool_cents: 0,
      team_allocation_basis_points: 0,
      individual_allocation_basis_points: 0,
      team_prize_pool_cents: 0,
      individual_prize_pool_cents: 0,
      configuration_version: null,
      configured_at: null,
      projected_payouts: [],
      finalized_payouts: [],
      unconfigured: true,
    };
  }

  return summary;
}

export async function configureSeasonPrizesCommand(
  {
    actorUserId,
    seasonId,
    entryFeeCents,
    administrationAmountCents,
    teamAllocationBasisPoints,
    individualAllocationBasisPoints,
    projectedFieldSize,
    payoutTemplates,
  },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!seasonId) {
    throw new Error('seasonId is required');
  }

  const entryFee = normalizeInteger(entryFeeCents, 'entryFeeCents');
  const administrationAmount = normalizeInteger(
    administrationAmountCents,
    'administrationAmountCents',
  );
  const teamAllocation = normalizeInteger(
    teamAllocationBasisPoints,
    'teamAllocationBasisPoints',
  );
  const individualAllocation = normalizeInteger(
    individualAllocationBasisPoints,
    'individualAllocationBasisPoints',
  );
  const fieldSize = normalizeInteger(projectedFieldSize, 'projectedFieldSize', { min: 1 });

  if (teamAllocation > 10000 || individualAllocation > 10000) {
    throw new Error('prize allocations must be 10000 basis points or fewer');
  }
  if (teamAllocation + individualAllocation !== 10000) {
    throw new Error('prize allocations must total 10000 basis points');
  }
  if (administrationAmount > entryFee * fieldSize) {
    throw new Error('administrationAmountCents cannot exceed projected gross');
  }

  assertRepository(repository, 'configureSeasonPrizes');

  return repository.configureSeasonPrizes({
    actorUserId,
    seasonId,
    entryFeeCents: entryFee,
    administrationAmountCents: administrationAmount,
    teamAllocationBasisPoints: teamAllocation,
    individualAllocationBasisPoints: individualAllocation,
    projectedFieldSize: fieldSize,
    payoutTemplates: normalizePayoutTemplates(payoutTemplates),
  });
}

export async function finalizeSeasonPrizePayoutsCommand(
  { actorUserId, seasonId, finalizedPayouts },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!seasonId) {
    throw new Error('seasonId is required');
  }

  assertRepository(repository, 'finalizeSeasonPrizePayouts');

  return repository.finalizeSeasonPrizePayouts({
    actorUserId,
    seasonId,
    finalizedPayouts: normalizeFinalizedPayouts(finalizedPayouts),
  });
}
