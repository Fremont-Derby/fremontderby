import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRaceCompletion } from '../src/scorecardPage.js';
import { scorePickerRetryAfterSeconds } from '../src/scorePickerPage.js';
import { preferredFreeAgentRound, safeFreeAgentCandidate, captainFreeAgentContexts } from '../src/jflFreeAgentsPage.js';
import { expectedSupabaseSchema, configuredSupabaseSchema } from '../src/supabaseSchema.js';

const cases = [
  [0, 0, 5, 5, null],
  [1, 0, 5, 5, null],
  [4, 4, 5, 5, null],
  [5, 0, 5, 5, 'A'],
  [5, 4, 5, 5, 'A'],
  [6, 1, 5, 5, 'A'],
  [0, 5, 5, 5, 'B'],
  [4, 5, 5, 5, 'B'],
  [1, 8, 5, 7, 'B'],
  [5, 5, 5, 5, null],
  [7, 7, 7, 7, null],
  [3, 5, 3, 5, null],
];
for (const [a, b, ta, tb, winner] of cases) {
  test('race ' + a + '-' + b + ' to ' + ta + '/' + tb + ' is ' + (winner || 'unfinished or split'), () => {
    const result = resolveRaceCompletion({ scoreA: a, scoreB: b, targetA: ta, targetB: tb });
    if (winner === null && (a < ta && b < tb)) assert.equal(result, null);
    else if (winner === null) assert.equal(result.winnerSide, null);
    else assert.equal(result.winnerSide, winner);
  });
}

for (const bad of [null, undefined, '', 'x', -1, 0]) {
  test('race rejects a bad target of ' + String(bad), () => {
    assert.equal(resolveRaceCompletion({ scoreA: 5, scoreB: 0, targetA: bad, targetB: 5 }), null);
  });
}

for (const seconds of [1, 2, 15, 30, 60, 119, 120, 121, 500]) {
  test('retry of ' + seconds + ' seconds is capped at 120', () => {
    const got = scorePickerRetryAfterSeconds(String(seconds));
    assert.equal(got, Math.min(seconds, 120));
  });
}

test('schema name for dru is dru', () => assert.equal(expectedSupabaseSchema('dru'), 'dru'));
test('schema name for jfl is jfl', () => assert.equal(expectedSupabaseSchema('jfl'), 'jfl'));
test('schema name for gamma is gamma', () => assert.equal(expectedSupabaseSchema('gamma'), 'gamma'));
test('schema name for production is public', () => assert.equal(expectedSupabaseSchema('production'), 'public'));
test('schema name for an unknown lane is null', () => assert.equal(expectedSupabaseSchema('nope'), null));
test('configured schema for dru matches dru', () => {
  assert.equal(configuredSupabaseSchema({ ENVIRONMENT: 'dru', SUPABASE_SCHEMA: 'dru' }), 'dru');
});
test('configured schema rejects a mismatch', () => {
  assert.throws(() => configuredSupabaseSchema({ ENVIRONMENT: 'dru', SUPABASE_SCHEMA: 'public' }));
});

const today = '2026-10-10';
for (const [label, rounds, expected] of [
  ['empty', [], ''],
  ['only past', [{ roundId: 'p', scheduledOn: '2026-01-01' }], 'p'],
  ['today', [{ roundId: 't', scheduledOn: '2026-10-10' }], 't'],
  ['future', [{ roundId: 'f', scheduledOn: '2026-12-01' }], 'f'],
  ['mixed', [{ roundId: 'p', scheduledOn: '2026-01-01' }, { roundId: 'n', scheduledOn: '2026-10-14' }], 'n'],
]) {
  test('preferred free-agent round: ' + label, () => {
    assert.equal(preferredFreeAgentRound(rounds, today), expected);
  });
}

for (const [label, row, name] of [
  ['blank', {}, 'Player'],
  ['named', { display_name: 'Ada' }, 'Ada'],
  ['empty name', { display_name: '' }, 'Player'],
]) {
  test('free agent name: ' + label, () => {
    assert.equal(safeFreeAgentCandidate(row).displayName, name);
  });
}
