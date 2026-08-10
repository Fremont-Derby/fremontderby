function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`standings repository must implement ${method}`);
  }
}

export async function listTeamStandingsCommand(
  { seasonId },
  repository,
) {
  if (!seasonId) {
    throw new Error('seasonId is required');
  }

  assertRepository(repository, 'listTeamStandings');

  return repository.listTeamStandings({ seasonId });
}
