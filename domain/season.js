import { generateRoundRobin } from './schedule.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    throw new Error('firstRoundDate must be an ISO date');
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('firstRoundDate must be a valid calendar date');
  }

  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function validateTableNumbers(tableNumbers) {
  if (!Array.isArray(tableNumbers) || tableNumbers.length !== 4) {
    throw new Error('Season 1 requires exactly four table numbers');
  }
  if (new Set(tableNumbers).size !== tableNumbers.length) {
    throw new Error('Table numbers must be unique');
  }
  for (const tableNumber of tableNumbers) {
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      throw new Error('Table numbers must be positive integers');
    }
  }
}

export function publishRegularSeasonSchedule({
  seasonId,
  teamIds,
  firstRoundDate,
  intervalDays = 7,
  tableNumbers = [1, 2, 3, 4],
}) {
  if (!seasonId) {
    throw new Error('seasonId is required');
  }
  if (!Number.isInteger(intervalDays) || intervalDays < 1) {
    throw new Error('intervalDays must be a positive integer');
  }

  validateTableNumbers(tableNumbers);

  const startDate = parseDateOnly(firstRoundDate);
  const rounds = generateRoundRobin(teamIds).map((round, roundIndex) => ({
    seasonId,
    roundNumber: round.round,
    stage: 'regular',
    scheduledOn: formatDateOnly(addDays(startDate, roundIndex * intervalDays)),
    matches: round.matches.map((match, matchIndex) => ({
      seasonId,
      roundNumber: round.round,
      stage: 'regular',
      tableNumber: tableNumbers[matchIndex],
      teamAId: match.teamA,
      teamBId: match.teamB,
    })),
  }));

  return {
    seasonId,
    status: 'active',
    rounds,
  };
}
