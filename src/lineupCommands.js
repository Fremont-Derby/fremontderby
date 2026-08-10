function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`lineup repository must implement ${method}`);
  }
}

function assertActor(actorUserId) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
}

function normalizeLineupSlots(slots) {
  if (!Array.isArray(slots)) {
    throw new Error('slots must be an array');
  }
  if (slots.length > 3) {
    throw new Error('Lineup cannot contain more than three slots');
  }

  return slots.map((slot, index) => {
    if (!slot || Array.isArray(slot) || typeof slot !== 'object') {
      throw new Error('Each lineup slot must be an object');
    }

    const slotNumber = slot.slotNumber ?? index + 1;
    if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 3) {
      throw new Error('Lineup slot numbers must be between 1 and 3');
    }

    return {
      slotNumber,
      playerId: slot.playerId ?? null,
    };
  });
}

export async function submitTeamLineupCommand(
  { actorUserId, teamId, roundId, slots },
  repository,
) {
  assertActor(actorUserId);
  if (!teamId) {
    throw new Error('teamId is required');
  }
  if (!roundId) {
    throw new Error('roundId is required');
  }

  assertRepository(repository, 'submitTeamLineup');

  return repository.submitTeamLineup({
    actorUserId,
    teamId,
    roundId,
    slots: normalizeLineupSlots(slots),
  });
}

export async function listVisibleTeamLineupsCommand(
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

  assertRepository(repository, 'listVisibleTeamLineups');

  return repository.listVisibleTeamLineups({
    actorUserId,
    teamId,
    roundId,
  });
}
