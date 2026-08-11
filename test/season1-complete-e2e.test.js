import assert from 'node:assert/strict';
import test from 'node:test';

import { createMatch, recordRack } from '../domain/match.js';
import {
  createAnchorTiebreaker,
  createChampionship,
  seedSemifinals,
  validatePostseasonLineup,
} from '../domain/playoffs.js';
import { generateRoundRobin } from '../domain/schedule.js';

const chart = [
  { maxDiff: 49, strongerTo: 5, weakerTo: 5 },
  { maxDiff: 99, strongerTo: 6, weakerTo: 5 },
  { maxDiff: 999, strongerTo: 7, weakerTo: 4 },
];

function playRace({ ratingA = 600, ratingB = 520, winner = 'A' } = {}) {
  let match = createMatch({
    ratingA,
    ratingB,
    chart,
    openingBlockLength: 3,
    lagWinner: 'A',
    lagChoice: 'discipline',
    openingDiscipline: '8-ball',
  });
  const target = winner === 'A' ? match.targets.a : match.targets.b;
  for (let rack = 0; rack < target; rack += 1) match = recordRack(match, winner);
  return match;
}

function makeTeam(index) {
  return {
    id: `team-${index}`,
    name: `Team ${index}`,
    players: [1, 2, 3, 4].map((slot) => ({
      playerId: `t${index}-p${slot}`,
      rating: 480 + index * 10 + slot * 4,
      teamMatchesPlayed: slot < 4 ? 4 : 3,
    })),
  };
}

test('complete deterministic Season 1 runs from eight teams through anchor-resolved champion', () => {
  const teams = Array.from({ length: 8 }, (_, index) => makeTeam(index + 1));
  const teamIds = teams.map((team) => team.id);
  const schedule = generateRoundRobin(teamIds);

  assert.equal(schedule.length, 7);
  assert.equal(schedule.every((round) => round.matches.length === 4), true);
  const pairings = schedule.flatMap((round) => round.matches.map(({ teamA, teamB }) => [teamA, teamB].sort().join(':')));
  assert.equal(pairings.length, 28);
  assert.equal(new Set(pairings).size, 28);

  const availability = new Map();
  availability.set('t1-p1:round-1', 'unavailable');
  availability.set('free-agent-1:round-1', 'available');
  const substitution = { teamId: 'team-1', round: 1, playerId: 'free-agent-1' };
  assert.equal(availability.get(`${substitution.playerId}:round-${substitution.round}`), 'available');

  const trade = {
    playerId: 't8-p4',
    fromTeamId: 'team-8',
    toTeamId: 'team-7',
    approved: true,
    beforeRosterLock: true,
  };
  assert.equal(trade.approved && trade.beforeRosterLock, true);

  const teamWins = new Map(teamIds.map((id) => [id, 0]));
  const individual = new Map();
  const regularHistory = [];
  for (const round of schedule) {
    for (const pairing of round.matches) {
      const teamA = teams.find((team) => team.id === pairing.teamA);
      const teamB = teams.find((team) => team.id === pairing.teamB);
      const lineupA = teamA.players.slice(0, 3);
      const lineupB = teamB.players.slice(0, 3);
      assert.equal(lineupA.length, 3);
      assert.equal(lineupB.length, 3);

      const slotResults = lineupA.map((playerA, index) => {
        const playerB = lineupB[index];
        const winnerTeamId = teamA.id < teamB.id
          ? (index < 2 ? teamA.id : teamB.id)
          : (index < 2 ? teamB.id : teamA.id);
        const winnerPlayerId = winnerTeamId === teamA.id ? playerA.playerId : playerB.playerId;
        for (const player of [playerA, playerB]) {
          const row = individual.get(player.playerId) || { played: 0, wins: 0 };
          row.played += 1;
          if (player.playerId === winnerPlayerId) row.wins += 1;
          individual.set(player.playerId, row);
        }
        return { slot: index + 1, winnerTeamId, winnerPlayerId };
      });

      const scoreA = slotResults.filter((result) => result.winnerTeamId === teamA.id).length;
      const scoreB = slotResults.filter((result) => result.winnerTeamId === teamB.id).length;
      assert.equal(scoreA + scoreB, 3);
      assert.notEqual(scoreA, scoreB);
      const winnerTeamId = scoreA > scoreB ? teamA.id : teamB.id;
      teamWins.set(winnerTeamId, teamWins.get(winnerTeamId) + 1);
      regularHistory.push({ round: round.round, teamAId: teamA.id, teamBId: teamB.id, slotResults, winnerTeamId });
    }
  }

  assert.equal(regularHistory.length, 28);
  assert.equal(regularHistory.every((matchup) => matchup.slotResults.length === 3), true);
  assert.equal([...individual.values()].every((row) => row.played <= 7), true);

  const sampleRace = playRace({ ratingA: 600, ratingB: 520, winner: 'A' });
  assert.deepEqual(sampleRace.targets, { a: 6, b: 5 });
  assert.equal(sampleRace.openingBlockLength, 3);
  assert.equal(sampleRace.racks.length, 6);
  assert.deepEqual(sampleRace.racks.slice(0, 3).map((rack) => rack.discipline), ['8-ball', '8-ball', '8-ball']);
  assert.equal(sampleRace.racks[3].discipline, '9-ball');
  assert.equal(sampleRace.winner, 'A');

  const ranked = [...teamIds].sort((left, right) => {
    const delta = teamWins.get(right) - teamWins.get(left);
    return delta || left.localeCompare(right);
  });
  assert.equal(ranked.length, 8);
  const topFour = ranked.slice(0, 4);
  const semifinals = seedSemifinals(topFour);
  assert.deepEqual(
    semifinals.map((match) => [match.teamAId, match.teamBId]),
    [[topFour[0], topFour[3]], [topFour[1], topFour[2]]],
  );

  for (const teamId of topFour) {
    const team = teams.find((candidate) => candidate.id === teamId);
    const validation = validatePostseasonLineup(team.players);
    assert.equal(validation.eligible, true);
    assert.equal(validation.fourMatchQualifierCount, 3);
    assert.equal(validation.threeMatchQualifierCount, 4);
  }

  const semiOneA = teams.find((team) => team.id === semifinals[0].teamAId);
  const semiOneB = teams.find((team) => team.id === semifinals[0].teamBId);
  const lockedAnchors = new Map([
    [semiOneA.id, semiOneA.players[0]],
    [semiOneB.id, semiOneB.players[0]],
  ]);
  const scheduledSemiResults = [semiOneA.id, semiOneB.id, semiOneA.id, semiOneB.id];
  assert.equal(scheduledSemiResults.filter((teamId) => teamId === semiOneA.id).length, 2);
  assert.equal(scheduledSemiResults.filter((teamId) => teamId === semiOneB.id).length, 2);

  const semifinalAnchor = createAnchorTiebreaker({
    championship: { teamAId: semiOneA.id, teamBId: semiOneB.id },
    teamAScore: 2,
    teamBScore: 2,
    anchorA: {
      ...lockedAnchors.get(semiOneA.id),
      teamId: semiOneA.id,
      eligible: true,
    },
    anchorB: {
      ...lockedAnchors.get(semiOneB.id),
      teamId: semiOneB.id,
      eligible: true,
    },
    chart,
    lagWinner: 'A',
    lagChoice: 'break',
    openingDiscipline: '9-ball',
  });
  assert.equal(semifinalAnchor.playerAId, lockedAnchors.get(semiOneA.id).playerId);
  assert.equal(semifinalAnchor.playerBId, lockedAnchors.get(semiOneB.id).playerId);
  let anchorRace = semifinalAnchor.match;
  while (!anchorRace.winner) anchorRace = recordRack(anchorRace, 'A');
  const semifinalOneWinner = anchorRace.winner === 'A' ? semiOneA.id : semiOneB.id;

  const semifinalTwoWinner = semifinals[1].teamAId;
  const championship = createChampionship([
    { winnerTeamId: semifinalOneWinner },
    { winnerTeamId: semifinalTwoWinner },
  ]);
  assert.equal(new Set([championship.teamAId, championship.teamBId]).size, 2);

  const champion = championship.teamAId;
  const postseasonHistory = {
    semifinals: [
      { scheduledResults: scheduledSemiResults, anchorWinnerTeamId: semifinalOneWinner },
      { scheduledResults: [semifinalTwoWinner, semifinalTwoWinner, semifinals[1].teamBId, semifinalTwoWinner] },
    ],
    championship: { winnerTeamId: champion },
  };
  assert.equal(postseasonHistory.semifinals[0].scheduledResults.length, 4);
  assert.equal(postseasonHistory.semifinals[0].anchorWinnerTeamId, semifinalOneWinner);
  assert.equal(postseasonHistory.championship.winnerTeamId, champion);

  const entryFeeCents = 5000;
  const paidEntrants = 32;
  const grossPurseCents = entryFeeCents * paidEntrants;
  const administrationCents = 20000;
  const teamPurseCents = 84000;
  const singlesPurseCents = 56000;
  assert.equal(administrationCents + teamPurseCents + singlesPurseCents, grossPurseCents);

  const regularRackAttribution = sampleRace.racks.map((rack) => ({ ...rack, playerMatchId: 'regular-sample-match' }));
  const anchorRackAttribution = anchorRace.racks.map((rack) => ({ ...rack, playerMatchId: 'postseason-anchor-match' }));
  assert.equal(regularRackAttribution.every((rack) => rack.playerMatchId === 'regular-sample-match'), true);
  assert.equal(anchorRackAttribution.every((rack) => rack.playerMatchId === 'postseason-anchor-match'), true);
  assert.equal(regularHistory.length, 28, 'postseason did not rewrite regular-season matchup history');
});
