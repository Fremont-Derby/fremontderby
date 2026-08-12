function requireValue(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requireMethod(repository, name) {
  if (!repository || typeof repository[name] !== 'function') {
    throw new Error(`admin season teams repository must implement ${name}`);
  }
}

export async function listAdminSeasonTeamsCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireMethod(repository, 'list');
  return repository.list(input);
}

export async function addAdminSeasonTeamCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireValue(input.teamId, 'teamId');
  requireMethod(repository, 'add');
  return repository.add(input);
}
