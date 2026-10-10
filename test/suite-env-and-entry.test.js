import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentFingerprint } from '../src/environmentFingerprint.js';
import { deriveAdminSeasonTeamEntry } from '../src/adminSeasonTeamEntry.js';
import { finishedScheduleMatchesById } from '../src/finishedScheduleEnhancer.js';

for (const version of ['abc123', 'a'.repeat(40), '', 'release-1']) {
  test('fingerprint keeps version ' + JSON.stringify(version || 'blank'), () => {
    const result = environmentFingerprint(
      { url: 'https://dru.fremontderby.com/' },
      { ENVIRONMENT: 'dru', DEPLOY_GIT_SHA: version },
    );
    assert.equal(result.version, version);
    assert.equal(result.mismatch, false);
  });
}

for (const count of [0, 1, 2, 3, 4, 5]) {
  test('in-season roster of ' + count + ' names the gap or is ready', () => {
    const entry = deriveAdminSeasonTeamEntry(
      { candidateKind: 'in_season', captainPlayerId: 'p1', activeRosterCount: count },
      {},
    );
    assert.equal(entry.entryStatus, 'accepted');
    assert.equal(entry.qualified, count >= 3);
    if (count < 3) assert.match(entry.reason, new RegExp('need ' + (3 - count)));
    else assert.match(entry.reason, /qualified/);
  });
}

for (const count of [0, 1, 2, 3]) {
  test('a new team with ' + count + ' players and no captain is not qualified', () => {
    const entry = deriveAdminSeasonTeamEntry(
      { candidateKind: 'new', activeRosterCount: count },
      { teamCapacity: 8, counts: { occupiedSlots: 1 } },
    );
    assert.equal(entry.qualified, false);
    assert.match(entry.reason, /assign a captain/);
  });
}

test('match index keeps the last copy of a repeated id', () => {
  const index = finishedScheduleMatchesById([
    { matches: [{ teamMatchId: 'm', teamAScore: 1 }] },
    { matches: [{ teamMatchId: 'm', teamAScore: 9 }] },
  ]);
  assert.equal(index.m.teamAScore, 9);
});

for (let n = 0; n < 12; n += 1) {
  test('match index holds ' + n + ' matches', () => {
    const rounds = [{ matches: Array.from({ length: n }, (_, i) => ({ teamMatchId: 'm' + i })) }];
    assert.equal(Object.keys(finishedScheduleMatchesById(rounds)).length, n);
  });
}
