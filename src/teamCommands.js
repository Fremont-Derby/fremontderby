function assertRepository(repository) {
  if (!repository || typeof repository.createTeamWithCaptain !== 'function') {
    throw new Error('team repository must implement createTeamWithCaptain');
  }
}

function normalizeTeamName(value) {
  if (typeof value !== 'string') {
    throw new Error('teamName is required');
  }

  const teamName = value.trim();
  if (teamName.length === 0) {
    throw new Error('teamName is required');
  }
  if (teamName.length > 80) {
    throw new Error('teamName must be 80 characters or fewer');
  }

  return teamName;
}

export async function createTeamWithCaptainCommand(
  { actorUserId, seasonId, teamName },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!seasonId) {
    throw new Error('seasonId is required');
  }

  assertRepository(repository);

  return repository.createTeamWithCaptain({
    actorUserId,
    seasonId,
    teamName: normalizeTeamName(teamName),
  });
}
