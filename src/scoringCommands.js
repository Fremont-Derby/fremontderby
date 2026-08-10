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
