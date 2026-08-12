function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`season close repository must implement ${method}`);
  }
}

function requireId(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export async function getSeasonCloseReadinessCommand(
  { actorUserId, seasonId },
  repository,
) {
  assertRepository(repository, 'getCloseReadiness');
  return repository.getCloseReadiness({
    actorUserId: requireId(actorUserId, 'actorUserId'),
    seasonId: requireId(seasonId, 'seasonId'),
  });
}

export async function closeSeasonCommand(
  { actorUserId, seasonId },
  repository,
) {
  assertRepository(repository, 'closeSeason');
  return repository.closeSeason({
    actorUserId: requireId(actorUserId, 'actorUserId'),
    seasonId: requireId(seasonId, 'seasonId'),
  });
}
