function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`dual scoring repository must implement ${method}`);
  }
}

function assertActor(actorUserId) {
  if (!actorUserId) throw new Error('actorUserId is required');
}

function assertPlayerMatchId(playerMatchId) {
  if (!playerMatchId) throw new Error('playerMatchId is required');
}

function normalizeWinnerSide(value) {
  if (!['A', 'B'].includes(value)) {
    throw new Error('winnerSide must be A or B');
  }
  return value;
}

export async function getPlayerMatchScoreComparisonCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'getPlayerMatchScoreComparison');
  return repository.getPlayerMatchScoreComparison({ actorUserId, playerMatchId });
}

export async function recordPlayerMatchScoreRackCommand(
  { actorUserId, playerMatchId, winnerSide },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'recordPlayerMatchScoreRack');
  return repository.recordPlayerMatchScoreRack({
    actorUserId,
    playerMatchId,
    winnerSide: normalizeWinnerSide(winnerSide),
  });
}

export async function undoPlayerMatchScoreRackCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'undoPlayerMatchScoreRack');
  return repository.undoPlayerMatchScoreRack({ actorUserId, playerMatchId });
}

export async function confirmPlayerMatchScoreCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'confirmPlayerMatchScore');
  return repository.confirmPlayerMatchScore({ actorUserId, playerMatchId });
}
