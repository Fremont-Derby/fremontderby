function assertRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new Error('team repository is required');
  }
}

function assertRepositoryMethod(repository, method) {
  assertRepository(repository);
  if (typeof repository[method] !== 'function') {
    throw new Error(`team repository must implement ${method}`);
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

  assertRepositoryMethod(repository, 'createTeamWithCaptain');

  return repository.createTeamWithCaptain({
    actorUserId,
    seasonId,
    teamName: normalizeTeamName(teamName),
  });
}

export async function invitePlayerToTeamCommand(
  { actorUserId, teamId, playerId },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!teamId) {
    throw new Error('teamId is required');
  }
  if (!playerId) {
    throw new Error('playerId is required');
  }

  assertRepositoryMethod(repository, 'invitePlayerToTeam');

  return repository.invitePlayerToTeam({
    actorUserId,
    teamId,
    playerId,
  });
}

export async function respondToTeamInvitationCommand(
  { actorUserId, invitationId, response },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!invitationId) {
    throw new Error('invitationId is required');
  }
  if (!['accepted', 'declined'].includes(response)) {
    throw new Error('response must be accepted or declined');
  }

  assertRepositoryMethod(repository, 'respondToTeamInvitation');

  return repository.respondToTeamInvitation({
    actorUserId,
    invitationId,
    response,
  });
}

export async function cancelTeamInvitationCommand(
  { actorUserId, invitationId },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!invitationId) {
    throw new Error('invitationId is required');
  }

  assertRepositoryMethod(repository, 'cancelTeamInvitation');

  return repository.cancelTeamInvitation({
    actorUserId,
    invitationId,
  });
}

export async function removeTeamMemberCommand(
  { actorUserId, membershipId },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!membershipId) {
    throw new Error('membershipId is required');
  }

  assertRepositoryMethod(repository, 'removeTeamMember');

  return repository.removeTeamMember({
    actorUserId,
    membershipId,
  });
}
