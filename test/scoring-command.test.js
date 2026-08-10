import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
