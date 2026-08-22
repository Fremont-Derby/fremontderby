const requiredRepositoryMethods = ['getProfileByUserId', 'saveProfile'];

function assertRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new Error('player profile repository is required');
  }

  for (const method of requiredRepositoryMethods) {
    if (typeof repository[method] !== 'function') {
      throw new Error(`player profile repository must implement ${method}`);
    }
  }
}

function normalizeDisplayName(value) {
  if (typeof value !== 'string') {
    throw new Error('displayName is required');
  }

  const displayName = value.trim();
  if (displayName.length === 0) {
    throw new Error('displayName is required');
  }
  if (displayName.length > 80) {
    throw new Error('displayName must be 80 characters or fewer');
  }

  return displayName;
}

function assertActor(actorUserId) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
}

export async function getOwnPlayerProfileCommand({ actorUserId }, repository) {
  assertActor(actorUserId);
  assertRepository(repository);
  return repository.getProfileByUserId(actorUserId);
}

export async function saveOwnPlayerProfileCommand({ actorUserId, displayName }, repository) {
  assertActor(actorUserId);
  assertRepository(repository);
  return repository.saveProfile({
    actorUserId,
    displayName: normalizeDisplayName(displayName),
  });
}
