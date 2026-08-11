import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTeamWithCaptainCommand,
} from '../src/teamCommands.js';
import {
  listVisibleTeamLineupsCommand,
  submitTeamLineupCommand,
} from '../src/lineupCommands.js';
import {
  confirmPlayerMatchScoreCommand,
  finalizeReconciledPlayerMatchCommand,
  getPlayerMatchScoreComparisonCommand,
  recordPlayerMatchScoreRackCommand,
  undoPlayerMatchScoreRackCommand,
} from '../src/dualScoringCommands.js';
import {
  listIndividualStandingsCommand,
  listTeamStandingsCommand,
} from '../src/standingsCommands.js';

function createRegularSeasonFixture() {
  const seasonId = 'season-1';
  const roundId = 'round-1';
  const teams = new Map();
  const lineups = new Map();
  const playerMatches = [];
  const scoreRecords = new Map();
  let nextTeam = 1;

  function teamForActor(actorUserId) {
    return [...teams.values()].find((team) => team.captainUserId === actorUserId) || null;
  }

  function ensureGeneratedMatches() {
    if (playerMatches.length || lineups.size !== 2) return;
    const [teamA, teamB] = [...teams.values()];
    const lineupA = lineups.get(teamA.id);
    const lineupB = lineups.get(teamB.id);

    for (let index = 0; index < 3; index += 1) {
      const match = {
        id: `player-match-${index + 1}`,
        seasonId,
        roundId,
        teamAId: teamA.id,
        teamBId: teamB.id,
        playerAId: lineupA[index].playerId,
        playerBId: lineupB[index].playerId,
        finalized: false,
        winnerTeamId: null,
      };
      playerMatches.push(match);
      scoreRecords.set(match.id, {
        A: [],
        B: [],
        confirmed: new Set(),
      });
    }
  }

  function matchById(playerMatchId) {
    const match = playerMatches.find((candidate) => candidate.id === playerMatchId);
    if (!match) throw new Error('Player match not found');
    return match;
  }

  function scorerSide(actorUserId, match) {
    const team = teamForActor(actorUserId);
    if (!team) throw new Error('Active team membership is required');
    if (team.id === match.teamAId) return 'A';
    if (team.id === match.teamBId) return 'B';
    throw new Error('Scorer is not on either match team');
  }

  const repository = {
    async createTeamWithCaptain({ actorUserId, seasonId: targetSeasonId, teamName }) {
      assert.equal(targetSeasonId, seasonId);
      const team = {
        id: `team-${nextTeam++}`,
        seasonId,
        name: teamName,
        captainUserId: actorUserId,
      };
      teams.set(team.id, team);
      return team;
    },

    async submitTeamLineup({ actorUserId, teamId, roundId: targetRoundId, slots }) {
      assert.equal(targetRoundId, roundId);
      const team = teams.get(teamId);
      if (!team || team.captainUserId !== actorUserId) {
        throw new Error('Only the active captain may submit this lineup');
      }
      if (lineups.has(teamId)) {
        throw new Error('Lineup is already locked');
      }
      lineups.set(teamId, slots.map((slot) => ({ ...slot })));
      ensureGeneratedMatches();
      return slots;
    },

    async listVisibleTeamLineups({ actorUserId, teamId, roundId: targetRoundId }) {
      assert.equal(targetRoundId, roundId);
      const actorTeam = teamForActor(actorUserId);
      if (!actorTeam || actorTeam.id !== teamId) {
        throw new Error('Only the active captain may view this lineup');
      }
      const rows = [];
      const own = lineups.get(teamId) || [];
      for (const slot of own) rows.push({ teamId, ...slot });
      if (lineups.size === 2) {
        for (const [otherTeamId, otherSlots] of lineups.entries()) {
          if (otherTeamId === teamId) continue;
          for (const slot of otherSlots) rows.push({ teamId: otherTeamId, ...slot });
        }
      }
      return rows;
    },

    async recordPlayerMatchScoreRack({ actorUserId, playerMatchId, winnerSide }) {
      const match = matchById(playerMatchId);
      const side = scorerSide(actorUserId, match);
      const record = scoreRecords.get(playerMatchId);
      record[side].push(winnerSide);
      record.confirmed.delete(side);
      return { side, rackNumber: record[side].length, winnerSide };
    },

    async undoPlayerMatchScoreRack({ actorUserId, playerMatchId }) {
      const match = matchById(playerMatchId);
      const side = scorerSide(actorUserId, match);
      const record = scoreRecords.get(playerMatchId);
      if (!record[side].length) throw new Error('no racks to undo');
      record[side].pop();
      record.confirmed.delete(side);
      return { side, rackCount: record[side].length };
    },

    async getPlayerMatchScoreComparison({ actorUserId, playerMatchId }) {
      const match = matchById(playerMatchId);
      scorerSide(actorUserId, match);
      const record = scoreRecords.get(playerMatchId);
      const max = Math.max(record.A.length, record.B.length);
      let firstMismatchIndex = null;
      for (let index = 0; index < max; index += 1) {
        if (record.A[index] !== record.B[index]) {
          firstMismatchIndex = index;
          break;
        }
      }
      return {
        matches: firstMismatchIndex === null && record.A.length === record.B.length,
        firstMismatchIndex,
        racksA: [...record.A],
        racksB: [...record.B],
      };
    },

    async confirmPlayerMatchScore({ actorUserId, playerMatchId }) {
      const match = matchById(playerMatchId);
      const side = scorerSide(actorUserId, match);
      const comparison = await repository.getPlayerMatchScoreComparison({ actorUserId, playerMatchId });
      if (!comparison.matches || comparison.racksA.length === 0) {
        throw new Error('rack history must match before confirmation');
      }
      scoreRecords.get(playerMatchId).confirmed.add(side);
      return { side, confirmed: true };
    },

    async finalizeReconciledPlayerMatch({ actorUserId, playerMatchId }) {
      const match = matchById(playerMatchId);
      scorerSide(actorUserId, match);
      const record = scoreRecords.get(playerMatchId);
      const comparison = await repository.getPlayerMatchScoreComparison({ actorUserId, playerMatchId });
      if (!comparison.matches || record.confirmed.size !== 2) {
        throw new Error('Both team score records must be confirmed');
      }
      match.finalized = true;
      const winsA = record.A.filter((winner) => winner === 'A').length;
      const winsB = record.A.filter((winner) => winner === 'B').length;
      match.winnerTeamId = winsA > winsB ? match.teamAId : match.teamBId;
      return match;
    },

    async listTeamStandings({ seasonId: targetSeasonId }) {
      assert.equal(targetSeasonId, seasonId);
      const [teamA, teamB] = [...teams.values()];
      const complete = playerMatches.length === 3 && playerMatches.every((match) => match.finalized);
      const winsA = playerMatches.filter((match) => match.winnerTeamId === teamA.id).length;
      const winsB = playerMatches.filter((match) => match.winnerTeamId === teamB.id).length;
      return [
        {
          teamId: teamA.id,
          teamName: teamA.name,
          gamesPlayed: complete ? 1 : 0,
          wins: complete && winsA > winsB ? 1 : 0,
          losses: complete && winsA < winsB ? 1 : 0,
          matchPoints: winsA,
        },
        {
          teamId: teamB.id,
          teamName: teamB.name,
          gamesPlayed: complete ? 1 : 0,
          wins: complete && winsB > winsA ? 1 : 0,
          losses: complete && winsB < winsA ? 1 : 0,
          matchPoints: winsB,
        },
      ];
    },

    async listIndividualStandings({ seasonId: targetSeasonId }) {
      assert.equal(targetSeasonId, seasonId);
      return playerMatches.flatMap((match) => [
        {
          playerId: match.playerAId,
          matchesPlayed: match.finalized ? 1 : 0,
          wins: match.finalized && match.winnerTeamId === match.teamAId ? 1 : 0,
        },
        {
          playerId: match.playerBId,
          matchesPlayed: match.finalized ? 1 : 0,
          wins: match.finalized && match.winnerTeamId === match.teamBId ? 1 : 0,
        },
      ]);
    },
  };

  return { repository, playerMatches, lineups, seasonId, roundId };
}

test('regular-season workflow composes from teams through blind lineups, reconciliation, finalization, and standings', async () => {
  const { repository, playerMatches, seasonId, roundId } = createRegularSeasonFixture();
  const captainA = 'captain-a';
  const captainB = 'captain-b';

  const teamA = await createTeamWithCaptainCommand(
    { actorUserId: captainA, seasonId, teamName: 'Break Room Bandits' },
    repository,
  );
  const teamB = await createTeamWithCaptainCommand(
    { actorUserId: captainB, seasonId, teamName: 'Golden Rail' },
    repository,
  );

  const lineupA = ['a1', 'a2', 'a3'].map((playerId, index) => ({ slotNumber: index + 1, playerId }));
  const lineupB = ['b1', 'b2', 'b3'].map((playerId, index) => ({ slotNumber: index + 1, playerId }));

  await submitTeamLineupCommand(
    { actorUserId: captainA, teamId: teamA.id, roundId, slots: lineupA },
    repository,
  );

  const hiddenOpponent = await listVisibleTeamLineupsCommand(
    { actorUserId: captainB, teamId: teamB.id, roundId },
    repository,
  );
  assert.equal(hiddenOpponent.length, 0);

  await assert.rejects(
    submitTeamLineupCommand(
      { actorUserId: captainA, teamId: teamA.id, roundId, slots: [...lineupA].reverse() },
      repository,
    ),
    /already locked/,
  );

  await submitTeamLineupCommand(
    { actorUserId: captainB, teamId: teamB.id, roundId, slots: lineupB },
    repository,
  );
  assert.equal(playerMatches.length, 3);
  assert.deepEqual(
    playerMatches.map((match) => [match.playerAId, match.playerBId]),
    [['a1', 'b1'], ['a2', 'b2'], ['a3', 'b3']],
  );

  for (const [index, match] of playerMatches.entries()) {
    await recordPlayerMatchScoreRackCommand(
      { actorUserId: captainA, playerMatchId: match.id, scoringTeamId: teamA.id, winnerSide: 'A' },
      repository,
    );
    await recordPlayerMatchScoreRackCommand(
      { actorUserId: captainB, playerMatchId: match.id, scoringTeamId: teamB.id, winnerSide: index === 0 ? 'B' : 'A' },
      repository,
    );

    if (index === 0) {
      const mismatch = await getPlayerMatchScoreComparisonCommand(
        { actorUserId: captainA, playerMatchId: match.id, scoringTeamId: teamA.id },
        repository,
      );
      assert.equal(mismatch.matches, false);
      assert.equal(mismatch.firstMismatchIndex, 0);

      await undoPlayerMatchScoreRackCommand(
        { actorUserId: captainB, playerMatchId: match.id, scoringTeamId: teamB.id },
        repository,
      );
      await recordPlayerMatchScoreRackCommand(
        { actorUserId: captainB, playerMatchId: match.id, scoringTeamId: teamB.id, winnerSide: 'A' },
        repository,
      );
    }

    const reconciled = await getPlayerMatchScoreComparisonCommand(
      { actorUserId: captainA, playerMatchId: match.id, scoringTeamId: teamA.id },
      repository,
    );
    assert.equal(reconciled.matches, true);

    await confirmPlayerMatchScoreCommand(
      { actorUserId: captainA, playerMatchId: match.id, scoringTeamId: teamA.id },
      repository,
    );
    await confirmPlayerMatchScoreCommand(
      { actorUserId: captainB, playerMatchId: match.id, scoringTeamId: teamB.id },
      repository,
    );
    await finalizeReconciledPlayerMatchCommand(
      { actorUserId: captainA, playerMatchId: match.id, scoringTeamId: teamA.id },
      repository,
    );
  }

  const teamStandings = await listTeamStandingsCommand({ seasonId }, repository);
  const individualStandings = await listIndividualStandingsCommand({ seasonId }, repository);

  assert.deepEqual(teamStandings, [
    {
      teamId: teamA.id,
      teamName: 'Break Room Bandits',
      gamesPlayed: 1,
      wins: 1,
      losses: 0,
      matchPoints: 3,
    },
    {
      teamId: teamB.id,
      teamName: 'Golden Rail',
      gamesPlayed: 1,
      wins: 0,
      losses: 1,
      matchPoints: 0,
    },
  ]);
  assert.equal(individualStandings.length, 6);
  assert.equal(individualStandings.every((row) => row.matchesPlayed === 1), true);
  assert.equal(individualStandings.filter((row) => row.wins === 1).length, 3);
});
