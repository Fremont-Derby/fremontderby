const requiredRepositoryMethods = ['getProfileByUserId', 'saveProfile', 'saveStandingAvailability'];

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

export async function saveOwnPlayerProfileCommand({ actorUserId, displayName, fargoExternalId }, repository) {
  assertActor(actorUserId);
  assertRepository(repository);
  let normalizedFargo = fargoExternalId;
  if (normalizedFargo != null) {
    normalizedFargo = String(normalizedFargo).trim();
    if (!normalizedFargo) normalizedFargo = null;
    else if (normalizedFargo.length > 40) throw new Error('fargo_external_id must be 40 characters or fewer');
  }
  return repository.saveProfile({
    actorUserId,
    displayName: normalizeDisplayName(displayName),
    fargoExternalId: normalizedFargo,
  });
}


const standingStatuses = new Set(['available_for_subs', 'limited', 'unavailable', 'prefer_not_to_say', '']);

export async function saveOwnStandingAvailabilityCommand(
  { actorUserId, standingStatus, standingNote },
  repository,
) {
  assertActor(actorUserId);
  assertRepository(repository);
  let status = standingStatus == null ? '' : String(standingStatus).trim().toLowerCase();
  // Common shorthand clients send
  if (status === 'available' || status === 'open' || status === 'yes') status = 'available_for_subs';
  if (status === 'no' || status === 'out') status = 'unavailable';
  if (!standingStatuses.has(status)) {
    throw new Error('standingStatus must be available_for_subs, limited, unavailable, prefer_not_to_say, or empty');
  }
  let note = standingNote == null ? null : String(standingNote).trim();
  if (note === '') note = null;
  if (note && note.length > 120) {
    throw new Error('standingNote must be 120 characters or fewer');
  }
  return repository.saveStandingAvailability({
    actorUserId,
    standingStatus: status || null,
    standingNote: note,
  });
}
