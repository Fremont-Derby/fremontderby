import { publishRegularSeasonSchedule } from '../domain/season.js';

const publishableStatuses = new Set(['draft', 'registration']);
const requiredRepositoryMethods = ['getSeason', 'listSeasonTeams', 'savePublishedSchedule'];

function assertRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new Error('season repository is required');
  }

  for (const method of requiredRepositoryMethods) {
    if (typeof repository[method] !== 'function') {
      throw new Error(`season repository must implement ${method}`);
    }
  }
}

function activeTeamIds(teams) {
  if (!Array.isArray(teams)) {
    throw new Error('Season teams must be an array');
  }

  const teamIds = teams
    .filter((team) => team.active !== false)
    .map((team) => team.id);

  if (teamIds.some((teamId) => !teamId)) {
    throw new Error('Season teams must have ids');
  }

  return teamIds;
}

export async function publishSeasonScheduleCommand(
  {
    seasonId,
    actorUserId,
    firstRoundDate,
    intervalDays = 7,
    tableNumbers = [1, 2, 3, 4],
  },
  repository,
) {
  if (!seasonId) {
    throw new Error('seasonId is required');
  }
  if (!actorUserId) {
    throw new Error('actorUserId is required');
  }

  assertRepository(repository);

  const season = await repository.getSeason(seasonId);
  if (!season) {
    throw new Error('Season not found');
  }
  if (!publishableStatuses.has(season.status)) {
    throw new Error('Season must be draft or registration to publish');
  }

  const teams = await repository.listSeasonTeams(seasonId);
  const schedule = publishRegularSeasonSchedule({
    seasonId,
    teamIds: activeTeamIds(teams),
    firstRoundDate,
    intervalDays,
    tableNumbers,
  });

  const saved = await repository.savePublishedSchedule({
    seasonId,
    actorUserId,
    previousStatus: season.status,
    nextStatus: schedule.status,
    rounds: schedule.rounds,
  });

  return {
    seasonId,
    status: schedule.status,
    roundCount: schedule.rounds.length,
    teamMatchCount: schedule.rounds.reduce((total, round) => total + round.matches.length, 0),
    saved,
  };
}
