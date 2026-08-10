function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`availability repository must implement ${method}`);
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

export async function setRosterAvailabilityCommand(
  { actorUserId, roundId, availabilityStatus },
  repository,
) {
  assertActor(actorUserId);
  if (!roundId) {
    throw new Error('roundId is required');
  }

  assertRepository(repository, 'setRosterAvailability');

  return repository.setRosterAvailability({
    actorUserId,
    roundId,
    availabilityStatus: normalizeAvailabilityStatus(availabilityStatus),
  });
}

export async function listTeamRoundAvailabilityCommand(
  { actorUserId, teamId, roundId },
  repository,
) {
  assertActor(actorUserId);
  if (!teamId) {
    throw new Error('teamId is required');
  }
  if (!roundId) {
    throw new Error('roundId is required');
  }

  assertRepository(repository, 'listTeamRoundAvailability');

  return repository.listTeamRoundAvailability({
    actorUserId,
    teamId,
    roundId,
  });
}
