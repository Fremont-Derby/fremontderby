function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`scoring repository must implement ${method}`);
  }
}

function assertActor(actorUserId) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
}

function normalizeWinnerSide(value) {
  if (!['A', 'B'].includes(value)) {
    throw new Error('winnerSide must be A or B');
  }

  return value;
}

function assertPlayerMatchId(playerMatchId) {
  if (!playerMatchId) {
    throw new Error('playerMatchId is required');
  }
}

function normalizeScore(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }

  return value;
}

function normalizeReason(value) {
  const reason = typeof value === 'string' ? value.trim() : '';
  if (!reason) {
    throw new Error('reason is required');
  }

  return reason;
}

function normalizeCorrectedRacks(racks) {
  if (!Array.isArray(racks) || racks.length === 0) {
    throw new Error('racks must be a non-empty array');
  }

  return racks.map((rack) => ({
    winnerSide: normalizeWinnerSide(rack?.winnerSide ?? rack?.winner_side),
  }));
}

export async function getPlayerMatchScorecardCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'getPlayerMatchScorecard');

  return repository.getPlayerMatchScorecard({
    actorUserId,
    playerMatchId,
  });
}

export async function recordPlayerMatchRackCommand(
  { actorUserId, playerMatchId, winnerSide },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'recordPlayerMatchRack');

  return repository.recordPlayerMatchRack({
    actorUserId,
    playerMatchId,
    winnerSide: normalizeWinnerSide(winnerSide),
  });
}

export async function undoPlayerMatchRackCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'undoPlayerMatchRack');

  return repository.undoPlayerMatchRack({
    actorUserId,
    playerMatchId,
  });
}

export async function finalizePlayerMatchCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'finalizePlayerMatch');

  return repository.finalizePlayerMatch({
    actorUserId,
    playerMatchId,
  });
}

export async function correctPlayerMatchCommand(
  { actorUserId, playerMatchId, winnerSide, scoreA, scoreB, reason, racks },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'correctPlayerMatch');

  return repository.correctPlayerMatch({
    actorUserId,
    playerMatchId,
    winnerSide: normalizeWinnerSide(winnerSide),
    scoreA: normalizeScore(scoreA, 'scoreA'),
    scoreB: normalizeScore(scoreB, 'scoreB'),
    reason: normalizeReason(reason),
    racks: normalizeCorrectedRacks(racks),
  });
}
