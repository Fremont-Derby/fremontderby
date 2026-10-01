function assertActor(actorUserId) {
  if (!actorUserId) throw new Error('actorUserId is required');
}

function normalizeResponse(value) {
  const normalized = String(value || '').toLowerCase();
  if (!['ready', 'maybe', 'not_ready'].includes(normalized)) {
    throw new Error('response must be ready, maybe, or not_ready');
  }
  return normalized;
}

export async function startTeamReadyCheckCommand({ actorUserId, teamId, roundId }, repository) {
  assertActor(actorUserId);
  if (!teamId) throw new Error('teamId is required');
  if (!roundId) throw new Error('roundId is required');
  if (!repository?.start) throw new Error('ready check repository must implement start');
  return repository.start({ actorUserId, teamId, roundId });
}

export async function respondTeamReadyCheckCommand({ actorUserId, readyCheckId, response }, repository) {
  assertActor(actorUserId);
  if (!readyCheckId) throw new Error('readyCheckId is required');
  if (!repository?.respond) throw new Error('ready check repository must implement respond');
  return repository.respond({
    actorUserId,
    readyCheckId,
    response: normalizeResponse(response),
  });
}

export async function listMyPendingReadyChecksCommand({ actorUserId }, repository) {
  assertActor(actorUserId);
  if (!repository?.listPending) throw new Error('ready check repository must implement listPending');
  return repository.listPending({ actorUserId });
}
