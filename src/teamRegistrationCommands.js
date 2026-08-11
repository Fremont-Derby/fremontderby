function requireValue(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requireMethod(repository, name) {
  if (!repository || typeof repository[name] !== 'function') {
    throw new Error(`team registration repository must implement ${name}`);
  }
}

function integerInRange(value, name, minimum, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new Error(`${name} must be between ${minimum} and ${maximum}`);
  }
  return number;
}

function normalizeTeamName(value) {
  if (typeof value !== 'string') throw new Error('teamName is required');
  const name = value.trim();
  if (!name || name.length > 80) throw new Error('teamName must be 80 characters or fewer');
  return name;
}

export function getOwnTeamRegistrationCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireMethod(repository, 'getOwn');
  return repository.getOwn(input);
}

export function submitTeamApplicationCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireMethod(repository, 'submitApplication');
  return repository.submitApplication({ ...input, teamName: normalizeTeamName(input.teamName) });
}

export function withdrawTeamApplicationCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.applicationId, 'applicationId');
  requireMethod(repository, 'withdrawApplication');
  return repository.withdrawApplication(input);
}

export function respondToReturningTeamSlotCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.slotId, 'slotId');
  if (!['confirm', 'release', 'transfer'].includes(input.action)) {
    throw new Error('action must be confirm, release, or transfer');
  }
  if (input.action === 'transfer') requireValue(input.transferPlayerId, 'transferPlayerId');
  requireMethod(repository, 'respondToReturningSlot');
  return repository.respondToReturningSlot(input);
}

export function getAdminSeasonRegistrationCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireMethod(repository, 'getAdmin');
  return repository.getAdmin(input);
}

export function configureSeasonRegistrationCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireMethod(repository, 'configure');
  return repository.configure({
    ...input,
    teamCapacity: integerInRange(input.teamCapacity, 'teamCapacity', 2, 32),
    minimumCommittedRoster: integerInRange(
      input.minimumCommittedRoster,
      'minimumCommittedRoster',
      1,
      20,
    ),
    conditionalHoldDays: integerInRange(
      input.conditionalHoldDays,
      'conditionalHoldDays',
      1,
      90,
    ),
  });
}

export function reviewTeamApplicationCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.applicationId, 'applicationId');
  if (!['approve', 'defer', 'reject'].includes(input.decision)) {
    throw new Error('decision must be approve, defer, or reject');
  }
  requireMethod(repository, 'reviewApplication');
  return repository.reviewApplication(input);
}

export function manageTeamSlotCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.slotId, 'slotId');
  if (!['confirm', 'release', 'extend', 'expire'].includes(input.action)) {
    throw new Error('action must be confirm, release, extend, or expire');
  }
  if (['release', 'extend', 'expire'].includes(input.action)) {
    requireValue(input.reason?.trim(), 'reason');
  }
  const extensionDays = input.action === 'extend'
    ? integerInRange(input.extensionDays, 'extensionDays', 1, 90)
    : input.extensionDays;
  requireMethod(repository, 'manageSlot');
  return repository.manageSlot({ ...input, extensionDays });
}

export function seedReturningTeamSlotsCommand(input, repository) {
  requireValue(input.actorUserId, 'actorUserId');
  requireValue(input.seasonId, 'seasonId');
  requireValue(input.sourceSeasonId, 'sourceSeasonId');
  requireMethod(repository, 'seedReturningSlots');
  return repository.seedReturningSlots(input);
}
