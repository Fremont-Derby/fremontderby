import { createMatch } from './match.js';

export function seedSemifinals(rankedTeamIds) {
  if (!Array.isArray(rankedTeamIds) || rankedTeamIds.length !== 4) {
    throw new Error('Playoffs require exactly four seeded teams');
  }
  if (new Set(rankedTeamIds).size !== rankedTeamIds.length) {
    throw new Error('Playoff team identifiers must be unique');
  }

  return [
    { round: 'semifinal', seedA: 1, teamAId: rankedTeamIds[0], seedB: 4, teamBId: rankedTeamIds[3] },
    { round: 'semifinal', seedA: 2, teamAId: rankedTeamIds[1], seedB: 3, teamBId: rankedTeamIds[2] },
  ];
}

export function createChampionship(semifinalResults) {
  if (!Array.isArray(semifinalResults) || semifinalResults.length !== 2) {
    throw new Error('Championship requires two semifinal results');
  }

  const winners = semifinalResults.map((result) => result?.winnerTeamId);
  if (winners.some((winner) => !winner)) {
    throw new Error('Both semifinal winners are required');
  }
  if (new Set(winners).size !== 2) {
    throw new Error('Semifinal winners must be different teams');
  }

  return {
    round: 'championship',
    teamAId: winners[0],
    teamBId: winners[1],
  };
}

export function createAnchorTiebreaker({
  championship,
  teamAScore,
  teamBScore,
  anchorA,
  anchorB,
  chart,
  openingBlockLength = 3,
  lagWinner,
  lagChoice,
  openingDiscipline,
}) {
  if (!championship?.teamAId || !championship?.teamBId) {
    throw new Error('Championship teams are required');
  }
  if (teamAScore !== teamBScore) {
    throw new Error('Anchor tiebreaker requires a tied championship score');
  }
  if (!anchorA?.playerId || anchorA.teamId !== championship.teamAId || anchorA.eligible !== true) {
    throw new Error('Team A anchor must be an eligible player on the championship team');
  }
  if (!anchorB?.playerId || anchorB.teamId !== championship.teamBId || anchorB.eligible !== true) {
    throw new Error('Team B anchor must be an eligible player on the championship team');
  }

  return {
    round: 'championship-anchor',
    teamAId: championship.teamAId,
    teamBId: championship.teamBId,
    playerAId: anchorA.playerId,
    playerBId: anchorB.playerId,
    match: createMatch({
      ratingA: anchorA.rating,
      ratingB: anchorB.rating,
      chart,
      openingBlockLength,
      lagWinner,
      lagChoice,
      openingDiscipline,
    }),
  };
}
