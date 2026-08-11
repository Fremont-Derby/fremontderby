function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`team match choice repository must implement ${method}`);
  }
}

function assertActor(actorUserId) {
  if (!actorUserId) throw new Error('actorUserId is required');
}

export async function listMyTeamMatchChoicesCommand(
  { actorUserId },
  repository,
) {
  assertActor(actorUserId);
  assertRepository(repository, 'listMyTeamMatchChoices');
  return repository.listMyTeamMatchChoices({ actorUserId });
}

export async function chooseTeamMatchTeamCommand(
  { actorUserId, teamMatchId, teamId },
  repository,
) {
  assertActor(actorUserId);
  if (!teamMatchId) throw new Error('teamMatchId is required');
  if (!teamId) throw new Error('teamId is required');
  assertRepository(repository, 'chooseTeamMatchTeam');
  return repository.chooseTeamMatchTeam({ actorUserId, teamMatchId, teamId });
}
