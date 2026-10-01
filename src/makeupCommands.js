function requireValue(value, message) {
  if (value == null || value === '') throw new Error(message);
  return value;
}

function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`repository must implement ${method}`);
  }
}

export async function proposeTeamMatchMakeupCommand(
  { actorUserId, teamMatchId, makeupOn, makeupLocation, makeupNote },
  repository,
) {
  assertRepository(repository, 'proposeTeamMatchMakeup');
  const on = String(requireValue(makeupOn, 'makeupOn is required')).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(on)) {
    throw new Error('makeupOn must be a date (YYYY-MM-DD)');
  }
  let location = makeupLocation == null ? null : String(makeupLocation).trim();
  if (location === '') location = null;
  if (location && location.length > 120) {
    throw new Error('makeupLocation must be 120 characters or fewer');
  }
  let note = makeupNote == null ? null : String(makeupNote).trim();
  if (note === '') note = null;
  if (note && note.length > 200) {
    throw new Error('makeupNote must be 200 characters or fewer');
  }
  return repository.proposeTeamMatchMakeup({
    actorUserId: requireValue(actorUserId, 'actorUserId is required'),
    teamMatchId: requireValue(teamMatchId, 'teamMatchId is required'),
    makeupOn: on,
    makeupLocation: location,
    makeupNote: note,
  });
}

export async function respondTeamMatchMakeupCommand(
  { actorUserId, teamMatchId, response },
  repository,
) {
  assertRepository(repository, 'respondTeamMatchMakeup');
  const cleaned = String(requireValue(response, 'response is required')).trim().toLowerCase();
  if (!['accepted', 'declined', 'cancelled'].includes(cleaned)) {
    throw new Error('response must be accepted, declined, or cancelled');
  }
  return repository.respondTeamMatchMakeup({
    actorUserId: requireValue(actorUserId, 'actorUserId is required'),
    teamMatchId: requireValue(teamMatchId, 'teamMatchId is required'),
    response: cleaned,
  });
}
