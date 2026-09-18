import assert from 'node:assert/strict';
import test from 'node:test';
import { renderLineupPage } from '../src/lineupPage.js';

function preferredRound(rounds, requestedRound = '', today = '2026-09-17') {
  if (
    requestedRound &&
    rounds.some(
      (round) =>
        round.roundId === requestedRound &&
        !['finalized', 'corrected'].includes(round.teamMatchStatus),
    )
  ) {
    return requestedRound;
  }
  const upcoming = rounds.find(
    (round) =>
      !['finalized', 'corrected'].includes(round.teamMatchStatus) &&
      (!round.scheduledOn || round.scheduledOn >= today),
  );
  return (
    upcoming ||
    rounds.find((round) => !['finalized', 'corrected'].includes(round.teamMatchStatus)) ||
    rounds[0] ||
    {}
  ).roundId || '';
}

test('lineup preferredRound source skips finalized/corrected remembered and query rounds', () => {
  const html = renderLineupPage();
  assert.match(
    html,
    /requestedRound&&rounds\.some\(\(round\)=>round\.roundId===requestedRound&&!\['finalized','corrected'\]\.includes\(round\.teamMatchStatus\)\)\)return requestedRound;/,
  );
  assert.doesNotMatch(
    html,
    /requestedRound&&rounds\.some\(\(round\)=>round\.roundId===requestedRound\)\)return requestedRound;/,
  );
});

test('preferredRound opens next unfinished night instead of a finished remembered night', () => {
  const rounds = [
    {
      roundId: 'round-1',
      roundNumber: 1,
      scheduledOn: '2026-09-03',
      teamMatchStatus: 'finalized',
    },
    {
      roundId: 'round-2',
      roundNumber: 2,
      scheduledOn: '2026-09-17',
      teamMatchStatus: 'scheduled',
    },
  ];

  assert.equal(preferredRound(rounds, 'round-1'), 'round-2');
  assert.equal(preferredRound(rounds, ''), 'round-2');
  assert.equal(preferredRound(rounds, 'round-2'), 'round-2');

  const corrected = [
    { ...rounds[0], teamMatchStatus: 'corrected' },
    rounds[1],
  ];
  assert.equal(preferredRound(corrected, 'round-1'), 'round-2');
});
