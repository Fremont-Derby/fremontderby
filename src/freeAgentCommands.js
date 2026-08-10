function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`free-agent repository must implement ${method}`);
  }
}

function assertActor(actorUserId) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
}

function normalizeAvailabilityStatus(value) {
  if (!['available', 'unavailable', 'unsure'].includes(value)) {
    throw new Error('availabilityStatus must be available, unavailable, or unsure');
  }

  return value;
}

export async function registerFreeAgentCommand({ actorUserId, seasonId }, repository) {
  assertActor(actorUserId);
  if (!seasonId) {
    throw new Error('seasonId is required');
  }

  assertRepository(repository, 'registerFreeAgent');

  return repository.registerFreeAgent({
    actorUserId,
    seasonId,
  });
}

export async function setFreeAgentAvailabilityCommand(
  { actorUserId, roundId, availabilityStatus },
  repository,
) {
  assertActor(actorUserId);
  if (!roundId) {
    throw new Error('roundId is required');
  }

  assertRepository(repository, 'setFreeAgentAvailability');

  return repository.setFreeAgentAvailability({
    actorUserId,
    roundId,
    availabilityStatus: normalizeAvailabilityStatus(availabilityStatus),
  });
}
