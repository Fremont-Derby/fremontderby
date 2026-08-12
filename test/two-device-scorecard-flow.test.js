import assert from 'node:assert/strict';
import test from 'node:test';

import { createDualScoringHttpHandlers } from '../src/dualScoringHttp.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameHistory(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createSharedScoringHarness({ openingDiscipline = '8-ball' } = {}) {
  const state = {
    teamA: [],
    teamB: [],
    confirmedA: false,
    confirmedB: false,
    finalized: false,
  };

  function keyForTeam(scoringTeamId) {
    if (scoringTeamId === 'team-a') return 'teamA';
    if (scoringTeamId === 'team-b') return 'teamB';
    throw new Error('Scoring team is not part of this player match');
  }

  function confirmedKey(scoringTeamId) {
    return scoringTeamId === 'team-a' ? 'confirmedA' : 'confirmedB';
  }

  function disciplineForRack(rackNumber) {
    if (rackNumber <= 3) return openingDiscipline;
    return openingDiscipline === '8-ball' ? '9-ball' : '8-ball';
  }

  function assertFresh(input) {
    const key = keyForTeam(input.scoringTeamId);
    if (!Array.isArray(input.expectedRacks)) {
      throw new Error('Refresh the scorecard before changing the score');
    }
    if (!sameHistory(state[key], input.expectedRacks)) {
      throw new Error('Supabase request failed with 400: Score changed on another device');
    }
    return key;
  }

  function comparison(input) {
    const ownKey = keyForTeam(input.scoringTeamId);
    const opponentKey = ownKey === 'teamA' ? 'teamB' : 'teamA';
    const own = clone(state[ownKey]);
    const opponent = clone(state[opponentKey]);
    const count = Math.max(own.length, opponent.length);
    let mismatchRackNumber = null;
    for (let index = 0; index < count; index += 1) {
      if (!sameHistory(own[index], opponent[index])) {
        mismatchRackNumber = index + 1;
        break;
      }
    }
    const historiesMatch = own.length > 0 && sameHistory(own, opponent);
    return {
      scoring_team_id: input.scoringTeamId,
      own_racks: own,
      opponent_racks: opponent,
      histories_match: historiesMatch,
      mismatch_rack_number: mismatchRackNumber,
      own_confirmed_at: state[confirmedKey(input.scoringTeamId)] ? '2026-08-12T00:00:00Z' : null,
      opponent_confirmed_at: state[confirmedKey(input.scoringTeamId === 'team-a' ? 'team-b' : 'team-a')]
        ? '2026-08-12T00:00:00Z'
        : null,
      both_confirmed: state.confirmedA && state.confirmedB,
      ready_to_finalize: historiesMatch && state.confirmedA && state.confirmedB,
    };
  }

  const repository = {
    async getPlayerMatchScoreComparison(input) {
      return comparison(input);
    },
    async recordPlayerMatchScoreRack(input) {
      const key = assertFresh(input);
      const rackNumber = state[key].length + 1;
      state[key].push({
        rackNumber,
        discipline: disciplineForRack(rackNumber),
        winnerSide: input.winnerSide,
      });
      state[confirmedKey(input.scoringTeamId)] = false;
      return { rack_number: rackNumber, winner_side: input.winnerSide };
    },
    async updatePlayerMatchScoreRack(input) {
      const key = assertFresh(input);
      const existing = state[key][input.rackNumber - 1];
      if (!existing) throw new Error('Rack is not present in this team score record');
      state[key][input.rackNumber - 1] = {
        ...existing,
        winnerSide: input.winnerSide,
      };
      state[confirmedKey(input.scoringTeamId)] = false;
      return { rack_number: input.rackNumber, winner_side: input.winnerSide };
    },
    async undoPlayerMatchScoreRack(input) {
      const key = assertFresh(input);
      if (!state[key].length) throw new Error('Score record has no racks to undo');
      const rack = state[key].pop();
      state[confirmedKey(input.scoringTeamId)] = false;
      return { undone_rack_number: rack.rackNumber };
    },
    async confirmPlayerMatchScore(input) {
      assertFresh(input);
      state[confirmedKey(input.scoringTeamId)] = true;
      return {
        histories_match: sameHistory(state.teamA, state.teamB),
        both_confirmed: state.confirmedA && state.confirmedB,
      };
    },
    async finalizeReconciledPlayerMatch() {
      if (!state.confirmedA || !state.confirmedB) {
        throw new Error('Both teams must confirm the reconciled score before finalization');
      }
      if (!sameHistory(state.teamA, state.teamB)) {
        throw new Error('Team score histories must match before finalization');
      }
      state.finalized = true;
      return { status: 'finalized' };
    },
  };

  const handlers = createDualScoringHttpHandlers({
    authenticate: async (request) => ({ id: request.headers.get('x-test-user') || 'user-1' }),
    createRepository: () => repository,
  });

  function request({
    user,
    team,
    body,
    path = 'score-racks',
  }) {
    return new Request(`https://example.test/api/player-matches/match-1/${path}?scoringTeamId=${team}`, {
      method: path === 'score-comparison' ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        'x-test-user': user,
      },
      body: path === 'score-comparison' ? undefined : JSON.stringify(body || {}),
    });
  }

  return { state, handlers, request };
}

test('two same-team devices cannot turn one real rack into two sequential rack writes', async () => {
  const { state, handlers, request } = createSharedScoringHarness();
  const viewedByDeviceA = [];
  const viewedByDeviceB = [];

  const first = await handlers.record(request({
    user: 'teammate-a',
    team: 'team-a',
    body: { winnerSide: 'A', expectedRacks: viewedByDeviceA },
  }), {}, 'match-1');
  assert.equal(first.status, 201);

  const stale = await handlers.record(request({
    user: 'teammate-b',
    team: 'team-a',
    body: { winnerSide: 'B', expectedRacks: viewedByDeviceB },
  }), {}, 'match-1');
  assert.equal(stale.status, 409);
  assert.match((await stale.json()).error, /Score changed on another device/);

  assert.equal(state.teamA.length, 1);
  assert.equal(state.teamA[0].rackNumber, 1);
  assert.equal(state.teamA[0].winnerSide, 'A');

  const refreshed = await handlers.compare(request({
    user: 'teammate-b',
    team: 'team-a',
    path: 'score-comparison',
  }), {}, 'match-1');
  const refreshedBody = await refreshed.json();
  assert.deepEqual(refreshedBody.comparison.own_racks, state.teamA);
});

test('two teams can mismatch, play later racks, surgically correct the old rack, and finalize', async () => {
  const { state, handlers, request } = createSharedScoringHarness();

  async function append(team, user, winnerSide) {
    const key = team === 'team-a' ? 'teamA' : 'teamB';
    const response = await handlers.record(request({
      user,
      team,
      body: { winnerSide, expectedRacks: clone(state[key]) },
    }), {}, 'match-1');
    assert.equal(response.status, 201);
  }

  await append('team-a', 'a1', 'A');
  await append('team-b', 'b1', 'A');
  await append('team-a', 'a1', 'B');
  await append('team-b', 'b1', 'B');

  await append('team-a', 'a1', 'A');
  await append('team-b', 'b1', 'B');
  await append('team-a', 'a1', 'A');
  await append('team-b', 'b1', 'A');

  const beforeCorrectionLaterRack = clone(state.teamA[3]);
  let comparisonResponse = await handlers.compare(request({
    user: 'a1', team: 'team-a', path: 'score-comparison',
  }), {}, 'match-1');
  let comparisonBody = await comparisonResponse.json();
  assert.equal(comparisonBody.comparison.mismatch_rack_number, 3);
  assert.equal(comparisonBody.comparison.histories_match, false);

  const correction = await handlers.record(request({
    user: 'a1',
    team: 'team-a',
    body: {
      rackNumber: 3,
      winnerSide: 'B',
      expectedRacks: clone(state.teamA),
    },
  }), {}, 'match-1');
  assert.equal(correction.status, 200);
  assert.deepEqual(state.teamA[3], beforeCorrectionLaterRack);
  assert.deepEqual(state.teamA, state.teamB);

  comparisonResponse = await handlers.compare(request({
    user: 'a2', team: 'team-a', path: 'score-comparison',
  }), {}, 'match-1');
  comparisonBody = await comparisonResponse.json();
  assert.equal(comparisonBody.comparison.histories_match, true);
  assert.equal(comparisonBody.comparison.mismatch_rack_number, null);

  let response = await handlers.confirm(request({
    user: 'a2',
    team: 'team-a',
    path: 'score-confirm',
    body: { expectedRacks: clone(state.teamA) },
  }), {}, 'match-1');
  assert.equal(response.status, 200);

  response = await handlers.confirm(request({
    user: 'b2',
    team: 'team-b',
    path: 'score-confirm',
    body: { expectedRacks: clone(state.teamB) },
  }), {}, 'match-1');
  assert.equal(response.status, 200);

  response = await handlers.finalize(request({
    user: 'a2',
    team: 'team-a',
    path: 'finalize-reconciled',
  }), {}, 'match-1');
  assert.equal(response.status, 200);
  assert.equal(state.finalized, true);
});

test('9-first view keeps racks 1-3 on 9-ball and switches rack 4 to 8-ball for both teams', async () => {
  const { state, handlers, request } = createSharedScoringHarness({ openingDiscipline: '9-ball' });

  for (const winnerSide of ['A', 'B', 'A', 'B']) {
    for (const [team, key, user] of [
      ['team-a', 'teamA', 'a1'],
      ['team-b', 'teamB', 'b1'],
    ]) {
      const response = await handlers.record(request({
        user,
        team,
        body: { winnerSide, expectedRacks: clone(state[key]) },
      }), {}, 'match-1');
      assert.equal(response.status, 201);
    }
  }

  assert.deepEqual(state.teamA.map((rack) => rack.discipline), [
    '9-ball', '9-ball', '9-ball', '8-ball',
  ]);
  assert.deepEqual(state.teamB.map((rack) => rack.discipline), [
    '9-ball', '9-ball', '9-ball', '8-ball',
  ]);
});
