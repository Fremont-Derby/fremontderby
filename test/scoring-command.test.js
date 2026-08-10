import test from 'node:test';
import assert from 'node:assert/strict';
import {
  correctPlayerMatchCommand,
  finalizePlayerMatchCommand,
  getPlayerMatchScorecardCommand,
  recordPlayerMatchRackCommand,
} from '../src/scoringCommands.js';

function createRepository() {
  const calls = [];

  return {
    calls,
    async getPlayerMatchScorecard(payload) {
      calls.push(['getPlayerMatchScorecard', payload]);
      return {
        player_match_id: payload.playerMatchId,
        score_a: 1,
        score_b: 0,
        current_discipline: '8-ball',
        racks: [],
      };
    },
    async recordPlayerMatchRack(payload) {
      calls.push(['recordPlayerMatchRack', payload]);
      return {
        player_match_id: payload.playerMatchId,
        rack_number: 1,
        winner_side: payload.winnerSide,
      };
    },
    async finalizePlayerMatch(payload) {
      calls.push(['finalizePlayerMatch', payload]);
      return {
        player_match_id: payload.playerMatchId,
        status: 'finalized',
      };
    },
    async correctPlayerMatch(payload) {
      calls.push(['correctPlayerMatch', payload]);
      return {
        player_match_id: payload.playerMatchId,
        status: 'corrected',
        winner_side: payload.winnerSide,
      };
    },
  };
}

test('scorecard command loads the authenticated actor scorecard', async () => {
  const repository = createRepository();

  const scorecard = await getPlayerMatchScorecardCommand(
    { actorUserId: 'user-1', playerMatchId: 'player-match-1' },
    repository,
  );

  assert.equal(scorecard.player_match_id, 'player-match-1');
  assert.deepEqual(repository.calls, [
    ['getPlayerMatchScorecard', {
      actorUserId: 'user-1',
      playerMatchId: 'player-match-1',
    }],
  ]);
});

test('record rack command records one winner-side action', async () => {
  const repository = createRepository();

  const rack = await recordPlayerMatchRackCommand(
    { actorUserId: 'user-1', playerMatchId: 'player-match-1', winnerSide: 'A' },
    repository,
  );

  assert.equal(rack.winner_side, 'A');
  assert.deepEqual(repository.calls, [
    ['recordPlayerMatchRack', {
      actorUserId: 'user-1',
      playerMatchId: 'player-match-1',
      winnerSide: 'A',
    }],
  ]);
});

test('record rack command rejects invalid winner sides before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => recordPlayerMatchRackCommand(
      { actorUserId: 'user-1', playerMatchId: 'player-match-1', winnerSide: 'C' },
      repository,
    ),
    /winnerSide must be A or B/,
  );

  assert.deepEqual(repository.calls, []);
});

test('finalize match command finalizes the authenticated actor match', async () => {
  const repository = createRepository();

  const match = await finalizePlayerMatchCommand(
    { actorUserId: 'user-1', playerMatchId: 'player-match-1' },
    repository,
  );

  assert.equal(match.status, 'finalized');
  assert.deepEqual(repository.calls, [
    ['finalizePlayerMatch', {
      actorUserId: 'user-1',
      playerMatchId: 'player-match-1',
    }],
  ]);
});

test('correct match command sends a normalized admin correction', async () => {
  const repository = createRepository();

  const match = await correctPlayerMatchCommand(
    {
      actorUserId: 'admin-user-1',
      playerMatchId: 'player-match-1',
      winnerSide: 'B',
      scoreA: 3,
      scoreB: 5,
      reason: '  Wrong winner was entered  ',
      racks: [
        { winnerSide: 'A' },
        { winner_side: 'B' },
        { winnerSide: 'B' },
        { winnerSide: 'A' },
        { winnerSide: 'B' },
        { winnerSide: 'B' },
        { winnerSide: 'B' },
        { winnerSide: 'A' },
      ],
    },
    repository,
  );

  assert.equal(match.status, 'corrected');
  assert.deepEqual(repository.calls, [
    ['correctPlayerMatch', {
      actorUserId: 'admin-user-1',
      playerMatchId: 'player-match-1',
      winnerSide: 'B',
      scoreA: 3,
      scoreB: 5,
      reason: 'Wrong winner was entered',
      racks: [
        { winnerSide: 'A' },
        { winnerSide: 'B' },
        { winnerSide: 'B' },
        { winnerSide: 'A' },
        { winnerSide: 'B' },
        { winnerSide: 'B' },
        { winnerSide: 'B' },
        { winnerSide: 'A' },
      ],
    }],
  ]);
});

test('correct match command validates correction fields before writing', async () => {
  const repository = createRepository();

  await assert.rejects(
    () => correctPlayerMatchCommand(
      {
        actorUserId: 'admin-user-1',
        playerMatchId: 'player-match-1',
        winnerSide: 'C',
        scoreA: 3,
        scoreB: 5,
        reason: 'Wrong winner',
        racks: [{ winnerSide: 'B' }],
      },
      repository,
    ),
    /winnerSide must be A or B/,
  );

  await assert.rejects(
    () => correctPlayerMatchCommand(
      {
        actorUserId: 'admin-user-1',
        playerMatchId: 'player-match-1',
        winnerSide: 'B',
        scoreA: 3.5,
        scoreB: 5,
        reason: 'Wrong winner',
        racks: [{ winnerSide: 'B' }],
      },
      repository,
    ),
    /scoreA must be a non-negative integer/,
  );

  await assert.rejects(
    () => correctPlayerMatchCommand(
      {
        actorUserId: 'admin-user-1',
        playerMatchId: 'player-match-1',
        winnerSide: 'B',
        scoreA: 3,
        scoreB: 5,
        reason: ' ',
        racks: [{ winnerSide: 'B' }],
      },
      repository,
    ),
    /reason is required/,
  );

  await assert.rejects(
    () => correctPlayerMatchCommand(
      {
        actorUserId: 'admin-user-1',
        playerMatchId: 'player-match-1',
        winnerSide: 'B',
        scoreA: 3,
        scoreB: 5,
        reason: 'Wrong winner',
        racks: [],
      },
      repository,
    ),
    /racks must be a non-empty array/,
  );
});
