function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`season lifecycle repository must implement ${method}`);
  }
}

function requireId(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export async function getSeasonLifecycleReadinessCommand(input, repository) {
  assertRepository(repository, 'getLifecycleReadiness');
  return repository.getLifecycleReadiness({
    actorUserId: requireId(input.actorUserId, 'actorUserId'),
    seasonId: requireId(input.seasonId, 'seasonId'),
  });
}

export async function cancelSeasonCommand(input, repository) {
  assertRepository(repository, 'cancelSeason');
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  if (reason.length < 3) throw new Error('Cancel reason is required (at least 3 characters)');
  return repository.cancelSeason({
    actorUserId: requireId(input.actorUserId, 'actorUserId'),
    seasonId: requireId(input.seasonId, 'seasonId'),
    reason,
  });
}

export async function archiveSeasonCommand(input, repository) {
  assertRepository(repository, 'archiveSeason');
  return repository.archiveSeason({
    actorUserId: requireId(input.actorUserId, 'actorUserId'),
    seasonId: requireId(input.seasonId, 'seasonId'),
  });
}

export async function safeDeleteSeasonCommand(input, repository) {
  assertRepository(repository, 'safeDeleteSeason');
  return repository.safeDeleteSeason({
    actorUserId: requireId(input.actorUserId, 'actorUserId'),
    seasonId: requireId(input.seasonId, 'seasonId'),
  });
}
