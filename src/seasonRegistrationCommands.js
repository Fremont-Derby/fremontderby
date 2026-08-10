const participationTypes = new Set(['rostered', 'free_agent']);

function assertRepository(repository) {
  if (!repository || typeof repository !== 'object') throw new Error('season registration repository is required');
  for (const method of ['register', 'getOwnRegistration']) {
    if (typeof repository[method] !== 'function') {
      throw new Error(`season registration repository must implement ${method}`);
    }
  }
}

export async function registerForSeasonCommand(
  { actorUserId, seasonId, participationType = 'free_agent' },
  repository,
) {
  if (!actorUserId) throw new Error('actorUserId is required');
  if (!seasonId) throw new Error('seasonId is required');
  if (!participationTypes.has(participationType)) {
    throw new Error('participationType must be rostered or free_agent');
  }
  assertRepository(repository);
  return repository.register({ actorUserId, seasonId, participationType });
}

export async function getOwnSeasonRegistrationCommand(
  { actorUserId, seasonId },
  repository,
) {
  if (!actorUserId) throw new Error('actorUserId is required');
  if (!seasonId) throw new Error('seasonId is required');
  assertRepository(repository);
  return repository.getOwnRegistration({ actorUserId, seasonId });
}
