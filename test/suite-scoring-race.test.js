import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRaceCompletion } from '../src/scorecardPage.js';
import { scorePickerRetryAfterSeconds } from '../src/scorePickerPage.js';
import { preferredFreeAgentRound, safeFreeAgentCandidate, captainFreeAgentContexts } from '../src/jflFreeAgentsPage.js';

test('race is unfinished when neither player has reached the target', () => {
  assert.equal(resolveRaceCompletion({ scoreA: 2, scoreB: 1, targetA: 5, targetB: 5 }), null);
});

test('player A wins when A reaches the target and B has not', () => {
  assert.deepEqual(resolveRaceCompletion({ scoreA: 5, scoreB: 3, targetA: 5, targetB: 5 }), {
    winnerSide: 'A', scoreA: 5, scoreB: 3,
  });
});

test('player B wins when B reaches the target and A has not', () => {
  assert.deepEqual(resolveRaceCompletion({ scoreA: 2, scoreB: 7, targetA: 5, targetB: 7 }), {
    winnerSide: 'B', scoreA: 2, scoreB: 7,
  });
});

test('a race with both sides at the target has no single winner', () => {
  assert.deepEqual(resolveRaceCompletion({ scoreA: 5, scoreB: 5, targetA: 5, targetB: 5 }), {
    winnerSide: null, scoreA: 5, scoreB: 5,
  });
});

test('a race with a missing or zero target does not name a winner', () => {
  assert.equal(resolveRaceCompletion({ scoreA: 5, scoreB: 0, targetA: 0, targetB: 5 }), null);
  assert.equal(resolveRaceCompletion({ scoreA: 'x', scoreB: 1, targetA: 5, targetB: 5 }), null);
});

test('a race accepts numeric strings the same as numbers', () => {
  assert.equal(resolveRaceCompletion({ scoreA: '4', scoreB: '2', targetA: '4', targetB: '5' }).winnerSide, 'A');
});

test('score picker retry uses a positive number of seconds, capped at two minutes', () => {
  assert.equal(scorePickerRetryAfterSeconds('30'), 30);
  assert.equal(scorePickerRetryAfterSeconds('500'), 120);
});

test('score picker retry falls back to fifteen seconds when the value is unusable', () => {
  assert.equal(scorePickerRetryAfterSeconds(''), 15);
  assert.equal(scorePickerRetryAfterSeconds(null), 15);
  assert.equal(scorePickerRetryAfterSeconds('0'), 15);
});

test('score picker retry turns a future timestamp into a wait, capped at two minutes', () => {
  const now = 1_000_000;
  assert.equal(scorePickerRetryAfterSeconds(new Date(now + 10_000).toISOString(), now), 10);
  assert.equal(scorePickerRetryAfterSeconds(new Date(now + 500_000).toISOString(), now), 120);
});

test('a free agent with no name is shown as Player', () => {
  assert.equal(safeFreeAgentCandidate({}).displayName, 'Player');
});

test('a free agent rating is kept only when it is a real number', () => {
  assert.equal(safeFreeAgentCandidate({ fargo_rating: 512 }).rating, 512);
  assert.equal(safeFreeAgentCandidate({ fargo_rating: null }).rating, null);
  assert.equal(safeFreeAgentCandidate({ fargo_rating: 'nope' }).rating, null);
});

test('a free agent with no availability is marked unsure', () => {
  assert.equal(safeFreeAgentCandidate({}).availability, 'unsure');
  assert.equal(safeFreeAgentCandidate({ availability_status: 'yes' }).availability, 'yes');
});

test('the preferred free-agent round is the next one on or after today', () => {
  const rounds = [
    { roundId: 'past', scheduledOn: '2026-01-01' },
    { roundId: 'next', scheduledOn: '2026-10-14' },
    { roundId: 'later', scheduledOn: '2026-10-21' },
  ];
  assert.equal(preferredFreeAgentRound(rounds, '2026-10-10'), 'next');
});

test('the preferred free-agent round falls back to the last round when all are past', () => {
  const rounds = [{ roundId: 'only', scheduledOn: '2026-01-01' }];
  assert.equal(preferredFreeAgentRound(rounds, '2026-10-10'), 'only');
});

test('the preferred free-agent round is empty when there are no rounds', () => {
  assert.equal(preferredFreeAgentRound([], '2026-10-10'), '');
});

test('captain free-agent context drops finalized and corrected matchups', () => {
  const contexts = captainFreeAgentContexts({
    captain_teams: [{
      teamId: 't1',
      teamName: 'Bandits',
      seasonName: 'Fall',
      lineupRounds: [
        { roundId: 'r1', roundNumber: 1, scheduledOn: '2026-10-07', opponentName: 'Rails', teamMatchStatus: 'finalized' },
        { roundId: 'r2', roundNumber: 2, scheduledOn: '2026-10-14', opponentName: 'Neighbors', teamMatchStatus: 'scheduled' },
      ],
    }],
  });
  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].teamName, 'Bandits');
  assert.deepEqual(contexts[0].rounds.map((round) => round.roundId), ['r2']);
});

test('captain free-agent context names a missing opponent as Opponent', () => {
  const contexts = captainFreeAgentContexts({
    captain_teams: [{
      teamId: 't1',
      lineupRounds: [{ roundId: 'r1', roundNumber: 1, scheduledOn: '2026-10-14', teamMatchStatus: 'scheduled' }],
    }],
  });
  assert.equal(contexts[0].rounds[0].opponentName, 'Opponent');
  assert.equal(contexts[0].teamName, 'Your team');
});

test('captain free-agent context ignores a team with no lineup rounds', () => {
  assert.deepEqual(captainFreeAgentContexts({ captain_teams: [{ teamId: 't1' }] }), []);
  assert.deepEqual(captainFreeAgentContexts({}), []);
});
