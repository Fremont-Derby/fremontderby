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

function normalizeReason(value) {
  const reason = typeof value === 'string' ? value.trim() : '';
  if (!reason) throw new Error('reason is required');
  return reason;
}

function normalizeResolvedRacks(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('resolvedRacks must be a non-empty array');
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

export async function finalizeReconciledPlayerMatchCommand(
  { actorUserId, playerMatchId },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'finalizeReconciledPlayerMatch');
  return repository.finalizeReconciledPlayerMatch({ actorUserId, playerMatchId });
}

export async function adminOverrideReconciledPlayerMatchCommand(
  { actorUserId, playerMatchId, reason, resolvedRacks },
  repository,
) {
  assertActor(actorUserId);
  assertPlayerMatchId(playerMatchId);
  assertRepository(repository, 'adminOverrideReconciledPlayerMatch');
  return repository.adminOverrideReconciledPlayerMatch({
    actorUserId,
    playerMatchId,
    reason: normalizeReason(reason),
    resolvedRacks: normalizeResolvedRacks(resolvedRacks),
  });
}
