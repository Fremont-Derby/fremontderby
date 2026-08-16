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


function normalizeTradePlayerResponse(value) {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'accept') return 'accepted';
  if (v === 'decline' || v === 'reject' || v === 'rejected') return 'declined';
  return v;
}

function normalizeTradeCaptainResponse(value) {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'approve') return 'approved';
  if (v === 'decline' || v === 'reject' || v === 'rejected') return 'declined';
  return v;
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

export async function listOwnTeamManagementCommand({ actorUserId }, repository) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }

  assertRepositoryMethod(repository, 'listOwnTeamManagement');

  return repository.listOwnTeamManagement({ actorUserId });
}

export async function listOwnTeamTradesCommand({ actorUserId }, repository) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }

  assertRepositoryMethod(repository, 'listOwnTeamTrades');

  return repository.listOwnTeamTrades({ actorUserId });
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

export async function proposeTeamTradeCommand(
  { actorUserId, teamId, offeredPlayerId, requestedTeamId, requestedPlayerId },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!teamId) {
    throw new Error('teamId is required');
  }
  if (!offeredPlayerId) {
    throw new Error('offeredPlayerId is required');
  }
  if (!requestedTeamId) {
    throw new Error('requestedTeamId is required');
  }
  if (!requestedPlayerId) {
    throw new Error('requestedPlayerId is required');
  }

  assertRepositoryMethod(repository, 'proposeTeamTrade');

  return repository.proposeTeamTrade({
    actorUserId,
    teamId,
    offeredPlayerId,
    requestedTeamId,
    requestedPlayerId,
  });
}

export async function adminProposeTeamTradeExceptionCommand(
  { actorUserId, teamId, offeredPlayerId, requestedTeamId, requestedPlayerId },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!teamId) {
    throw new Error('teamId is required');
  }
  if (!offeredPlayerId) {
    throw new Error('offeredPlayerId is required');
  }
  if (!requestedTeamId) {
    throw new Error('requestedTeamId is required');
  }
  if (!requestedPlayerId) {
    throw new Error('requestedPlayerId is required');
  }

  assertRepositoryMethod(repository, 'adminProposeTeamTradeException');

  return repository.adminProposeTeamTradeException({
    actorUserId,
    teamId,
    offeredPlayerId,
    requestedTeamId,
    requestedPlayerId,
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

export async function respondToTeamTradePlayerCommand(
  { actorUserId, tradeId, response },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!tradeId) {
    throw new Error('tradeId is required');
  }
  response = normalizeTradePlayerResponse(response);
  if (!['accepted', 'declined'].includes(response)) {
    throw new Error('response must be accepted or declined');
  }

  assertRepositoryMethod(repository, 'respondToTeamTradePlayer');

  return repository.respondToTeamTradePlayer({
    actorUserId,
    tradeId,
    response,
  });
}

export async function approveTeamTradeCaptainCommand(
  { actorUserId, tradeId, response },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!tradeId) {
    throw new Error('tradeId is required');
  }
  response = normalizeTradeCaptainResponse(response);
  if (!['approved', 'declined'].includes(response)) {
    throw new Error('response must be approved or declined');
  }

  assertRepositoryMethod(repository, 'approveTeamTradeCaptain');

  return repository.approveTeamTradeCaptain({
    actorUserId,
    tradeId,
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

function normalizePracticeField(value, fieldName) {
  if (value == null) return null;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be text`);
  }
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned.length > 120) {
    throw new Error(`${fieldName} must be 120 characters or fewer`);
  }
  return cleaned;
}

function normalizePracticeRecurrence(value) {
  if (value == null || value === '') return null;
  const cleaned = String(value).trim().toLowerCase();
  if (!cleaned) return null;
  if (cleaned !== 'weekly' && cleaned !== 'once') {
    throw new Error('practiceRecurrence must be weekly or once');
  }
  return cleaned;
}

function normalizePracticeOn(value, recurrence) {
  if (recurrence !== 'once') return null;
  if (value == null || value === '') {
    throw new Error('practiceOn is required for a one-off practice');
  }
  const cleaned = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    throw new Error('practiceOn must be a date (YYYY-MM-DD)');
  }
  return cleaned;
}

export function formatTeamPracticeAnnouncement(practice) {
  const location = practice?.practiceLocation || practice?.practice_location;
  const schedule = practice?.practiceSchedule || practice?.practice_schedule;
  const recurrence = practice?.practiceRecurrence || practice?.practice_recurrence;
  const on = practice?.practiceOn || practice?.practice_on;
  const teamName = practice?.teamName || practice?.team_name || 'the team';

  if (!location && !schedule && !recurrence) {
    return `Practice for ${teamName} was cleared by the captain.`;
  }

  const bits = [];
  if (recurrence === 'weekly') bits.push('Weekly practice');
  else if (recurrence === 'once') bits.push(on ? `One-off practice on ${on}` : 'One-off practice');
  if (location) bits.push(`Location: ${location}`);
  if (schedule) bits.push(`Time: ${schedule}`);
  if (!bits.length) return `Practice update for ${teamName}.`;
  return `Practice update for ${teamName}: ${bits.join(' · ')}`;
}

export async function updateTeamPracticeCommand(
  { actorUserId, teamId, practiceLocation, practiceSchedule, practiceRecurrence, practiceOn },
  repository,
  { chatRepository } = {},
) {
  if (!actorUserId) throw new Error('actorUserId is required');
  if (!teamId) throw new Error('teamId is required');
  assertRepositoryMethod(repository, 'updateTeamPractice');

  let recurrence = normalizePracticeRecurrence(practiceRecurrence);
  const location = normalizePracticeField(practiceLocation, 'practiceLocation');
  const schedule = normalizePracticeField(practiceSchedule, 'practiceSchedule');

  // Default to weekly when captains fill details but leave recurrence blank.
  if ((location || schedule || practiceOn) && !recurrence) {
    recurrence = 'weekly';
  }

  const on = normalizePracticeOn(practiceOn, recurrence);

  const practice = await repository.updateTeamPractice({
    actorUserId,
    teamId,
    practiceLocation: location,
    practiceSchedule: schedule,
    practiceRecurrence: recurrence,
    practiceOn: on,
  });

  if (chatRepository && typeof chatRepository.sendTeamMessage === 'function') {
    try {
      await chatRepository.sendTeamMessage({
        actorUserId,
        teamId,
        body: formatTeamPracticeAnnouncement(practice),
        clientMessageId: null,
      });
    } catch {
      // Practice save should succeed even if chat notify fails.
    }
  }

  return practice;
}


export async function listTradeCounterpartyOptionsCommand({ actorUserId, seasonId }, repository) {
  if (!actorUserId) throw new Error('actorUserId is required');
  if (!seasonId) throw new Error('seasonId is required');
  if (!repository || typeof repository.listTradeCounterpartyOptions !== 'function') {
    throw new Error('repository must implement listTradeCounterpartyOptions');
  }
  return repository.listTradeCounterpartyOptions({ actorUserId, seasonId });
}
