function requireValue(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requireMethod(repository, name) {
  if (!repository || typeof repository[name] !== 'function') {
    throw new Error(`admin season teams repository must implement ${name}`);
  }
}

function normalizeTeamName(value) {
  if (typeof value !== 'string') throw new Error('teamName is required');
  const name = value.trim();
  if (!name) throw new Error('teamName is required');
  if (name.length > 80) throw new Error('teamName must be 80 characters or fewer');
  return name;
}

function candidateValue(row, camelName, snakeName) {
  return row?.[camelName] ?? row?.[snakeName];
}

export async function listAdminSeasonTeamsCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireMethod(repository, 'list');
  return repository.list(input);
}

export async function createPreparedAdminSeasonTeamCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireMethod(repository, 'createPrepared');
  return repository.createPrepared({
    ...input,
    teamName: normalizeTeamName(input.teamName),
  });
}

export async function addAdminSeasonTeamCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireValue(input.teamId, 'teamId');
  requireMethod(repository, 'list');
  requireMethod(repository, 'add');

  const state = await repository.list({
    actorUserId: input.actorUserId,
    seasonId: input.seasonId,
  });
  const candidate = (state?.teams ?? []).find(
    (row) => candidateValue(row, 'teamId', 'team_id') === input.teamId,
  );
  const candidateKind = candidateValue(candidate, 'candidateKind', 'candidate_kind');
  const qualified = Boolean(
    candidateValue(candidate, 'qualifiedForSlot', 'qualified_for_slot'),
  );

  if (candidateKind === 'new' && !qualified) {
    const reason = candidateValue(candidate, 'entryReason', 'entry_reason');
    throw new Error(
      `Team must be qualified before it can take a season slot${reason ? `: ${reason}` : ''}`,
    );
  }

  return repository.add(input);
}

export async function listAdminTeamCaptainCandidatesCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireValue(input.teamId, 'teamId');
  requireMethod(repository, 'listCaptainCandidates');
  return repository.listCaptainCandidates(input);
}

export async function assignAdminTeamCaptainCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireValue(input.teamId, 'teamId');
  requireValue(input.playerId, 'playerId');
  requireMethod(repository, 'assignCaptain');
  return repository.assignCaptain(input);
}
