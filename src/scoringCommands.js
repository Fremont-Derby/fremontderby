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

export async function getPlayerMatchScorecardCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  if (!playerMatchId) {
    throw new Error('playerMatchId is required');
  }

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
  if (!playerMatchId) {
    throw new Error('playerMatchId is required');
  }

  assertRepository(repository, 'recordPlayerMatchRack');

  return repository.recordPlayerMatchRack({
    actorUserId,
    playerMatchId,
    winnerSide: normalizeWinnerSide(winnerSide),
  });
}
