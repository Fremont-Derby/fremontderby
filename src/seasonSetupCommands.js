const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`season setup repository must implement ${method}`);
  }
}

function normalizeString(value, name, maxLength) {
  if (typeof value !== 'string') {
    throw new Error(`${name} is required`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${name} is required`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${name} must be ${maxLength} characters or fewer`);
  }

  return normalized;
}

function normalizeInteger(value, name, { min = 1 } = {}) {
  const number = typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;

  if (!Number.isInteger(number) || number < min) {
    throw new Error(`${name} must be ${min === 1 ? 'greater than zero' : `at least ${min}`}`);
  }

  return number;
}

function normalizeDate(value, name) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    throw new Error(`${name} must be an ISO date`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${name} must be a valid calendar date`);
  }

  return value;
}

function normalizeTableNumbers(value) {
  const raw = typeof value === 'string'
    ? value.split(',').map((part) => part.trim()).filter(Boolean)
    : value;

  if (!Array.isArray(raw) || raw.length !== 4) {
    throw new Error('tableNumbers must contain four table numbers');
  }

  const tableNumbers = raw.map((tableNumber) => normalizeInteger(tableNumber, 'table number'));
  if (new Set(tableNumbers).size !== 4) {
    throw new Error('tableNumbers must be unique');
  }

  return tableNumbers;
}

export async function getSeasonSetupCommand({ actorUserId, seasonId }, repository) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }
  if (!seasonId) {
    throw new Error('seasonId is required');
  }

  assertRepository(repository, 'getSeasonSetup');
  const setup = await repository.getSeasonSetup({ actorUserId, seasonId });
  if (!setup) {
    throw new Error('Season not found');
  }

  return setup;
}

export async function saveSeasonSetupCommand(
  {
    actorUserId,
    seasonId = null,
    seasonName,
    leagueNight,
    firstRoundDate,
    rosterLockRound,
    openingBlockLength,
    individualMinMatches,
    roundIntervalDays,
    tableNumbers,
    raceChartVersion,
    playoffTeamCount,
    playoffAnchorTiebreaker,
  },
  repository,
) {
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }

  assertRepository(repository, 'saveSeasonSetup');

  return repository.saveSeasonSetup({
    actorUserId,
    seasonId,
    seasonName: normalizeString(seasonName, 'seasonName', 80),
    leagueNight: normalizeString(leagueNight, 'leagueNight', 40),
    firstRoundDate: normalizeDate(firstRoundDate, 'firstRoundDate'),
    rosterLockRound: normalizeInteger(rosterLockRound, 'rosterLockRound'),
    openingBlockLength: normalizeInteger(openingBlockLength, 'openingBlockLength'),
    individualMinMatches: normalizeInteger(individualMinMatches, 'individualMinMatches'),
    roundIntervalDays: normalizeInteger(roundIntervalDays, 'roundIntervalDays'),
    tableNumbers: normalizeTableNumbers(tableNumbers),
    raceChartVersion: normalizeString(raceChartVersion, 'raceChartVersion', 80),
    playoffTeamCount: normalizeInteger(playoffTeamCount, 'playoffTeamCount', { min: 2 }),
    playoffAnchorTiebreaker: playoffAnchorTiebreaker !== false,
  });
}
