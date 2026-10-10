import test from 'node:test';
import assert from 'node:assert/strict';
import { finishedScheduleWinnerSide, finishedScheduleMatchesById } from '../src/finishedScheduleEnhancer.js';
import { deriveAdminSeasonTeamEntry, INITIAL_TEAM_ROSTER_MINIMUM } from '../src/adminSeasonTeamEntry.js';
import { supabaseProjectRefFromUrl } from '../src/environmentReadiness.js';
import { environmentFingerprint } from '../src/environmentFingerprint.js';
import { isKnownAppPagePath, renderNotFoundPage, decorateHtmlWithShell, friendlyErrorMessage } from '../src/appShell.js';

test('the initial roster minimum is three players', () => {
  assert.equal(INITIAL_TEAM_ROSTER_MINIMUM, 3);
});

const winnerCases = [
  [{}, ''],
  [{ status: 'scheduled', teamAScore: 5, teamBScore: 1 }, ''],
  [{ status: 'finalized' }, ''],
  [{ status: 'finalized', teamAScore: 5, teamBScore: 5 }, ''],
  [{ status: 'finalized', teamAScore: 6, teamBScore: 2 }, 'a'],
  [{ status: 'finalized', teamAScore: 1, teamBScore: 4 }, 'b'],
  [{ status: 'corrected', scoreA: 8, scoreB: 3 }, 'a'],
  [{ status: 'corrected', score_a: 2, score_b: 9 }, 'b'],
  [{ status: 'finalized', team_a_score: 0, team_b_score: 1 }, 'b'],
  [{ status: 'finalized', teamAScore: '4', teamBScore: '1' }, 'a'],
  [{ status: 'finalized', teamAScore: '', teamBScore: 1 }, ''],
  [{ status: 'finalized', teamAScore: null, teamBScore: 1 }, ''],
];
for (const [match, side] of winnerCases) {
  test('finished winner for ' + JSON.stringify(match) + ' is ' + JSON.stringify(side), () => {
    assert.equal(finishedScheduleWinnerSide(match), side);
  });
}

test('finished matches are indexed by team match id', () => {
  const index = finishedScheduleMatchesById([
    { matches: [{ teamMatchId: 'm1', status: 'finalized' }, { team_match_id: 'm2' }] },
    { matches: [{ teamMatchId: '' }, null] },
  ]);
  assert.equal(index.m1.status, 'finalized');
  assert.ok(index.m2);
  assert.equal(Object.keys(index).length, 2);
});

test('finished match index is empty for no rounds', () => {
  assert.deepEqual(finishedScheduleMatchesById([]), {});
  assert.deepEqual(finishedScheduleMatchesById(null), {});
});

const entryCases = [
  [{ candidateKind: 'in_season', captainPlayerId: 'p1', activeRosterCount: 3 }, 'accepted', true],
  [{ candidateKind: 'in_season', captainPlayerId: null, activeRosterCount: 3 }, 'accepted', false],
  [{ candidateKind: 'in_season', captainPlayerId: 'p1', activeRosterCount: 1 }, 'accepted', false],
  [{ candidateKind: 'returning', captainPlayerId: 'p1', activeRosterCount: 3 }, 'forming', false],
  [{ candidateKind: 'new', captainPlayerId: 'p1', activeRosterCount: 3 }, null, true],
  [{ candidateKind: 'new', captainPlayerId: null, activeRosterCount: 0 }, null, false],
];
for (const [row, status, qualified] of entryCases) {
  test('team entry ' + row.candidateKind + ' captain=' + Boolean(row.captainPlayerId) + ' roster=' + row.activeRosterCount, () => {
    const entry = deriveAdminSeasonTeamEntry(row, { teamCapacity: 8, takenSlots: 2 });
    if (status) assert.equal(entry.entryStatus, status);
    assert.equal(entry.qualified, qualified);
    assert.equal(typeof entry.reason, 'string');
    assert.ok(entry.reason.length > 0);
  });
}

test('a returning team can take a slot only when one is open', () => {
  const open = deriveAdminSeasonTeamEntry({ candidateKind: 'returning' }, { teamCapacity: 8, counts: { occupiedSlots: 2 } });
  const full = deriveAdminSeasonTeamEntry({ candidateKind: 'returning' }, { teamCapacity: 8, counts: { occupiedSlots: 8 } });
  assert.equal(open.canTakeSlot, true);
  assert.equal(full.canTakeSlot, false);
  assert.match(full.reason, /no slot currently open/);
});

test('an in-season team that needs players names the count', () => {
  const entry = deriveAdminSeasonTeamEntry(
    { candidateKind: 'in_season', captainPlayerId: 'p1', activeRosterCount: 1 },
    {},
  );
  assert.match(entry.reason, /need 2 more rostered players/);
});

const refCases = [
  ['https://abccompany.supabase.co', 'abccompany'],
  ['https://abccompany.supabase.co/rest/v1', 'abccompany'],
  ['http://nope.example.com', null],
  ['', null],
  [null, null],
  ['not a url', null],
];
for (const [url, ref] of refCases) {
  test('supabase ref for ' + JSON.stringify(url) + ' is ' + JSON.stringify(ref), () => {
    assert.equal(supabaseProjectRefFromUrl(url), ref);
  });
}

const hosts = [
  ['https://fremontderby.com/', 'production'],
  ['https://www.fremontderby.com/', 'production'],
  ['https://jfl.fremontderby.com/', 'jfl'],
  ['https://dru.fremontderby.com/', 'dru'],
  ['https://gamma.fremontderby.com/', 'gamma'],
  ['https://localhost/', null],
];
const runtimes = ['production', 'jfl', 'dru', 'gamma', 'staging'];
for (const [url, expected] of hosts) {
  for (const runtime of runtimes) {
    test('fingerprint ' + url + ' as ' + runtime, () => {
      const result = environmentFingerprint({ url }, { ENVIRONMENT: runtime });
      assert.equal(result.runtime, runtime);
      assert.equal(result.expected, expected);
      assert.equal(typeof result.mismatch, 'boolean');
    });
  }
}

test('a dru host running as dru is not a mismatch', () => {
  const result = environmentFingerprint({ url: 'https://dru.fremontderby.com/' }, { ENVIRONMENT: 'dru' });
  assert.equal(result.mismatch, false);
});

test('a dru host running as production is a mismatch', () => {
  const result = environmentFingerprint({ url: 'https://dru.fremontderby.com/' }, { ENVIRONMENT: 'production' });
  assert.equal(result.mismatch, true);
});

test('localhost running as dru is not a mismatch', () => {
  const result = environmentFingerprint({ url: 'http://localhost/' }, { ENVIRONMENT: 'dru' });
  assert.equal(result.mismatch, false);
});

const known = ['/scorecard', '/schedule', '/standings', '/prizes', '/season-setup', '/lineup', '/profile', '/availability', '/teams', '/messages', '/messages/moderation'];
for (const path of known) {
  test(path + ' is a known app page', () => {
    assert.equal(isKnownAppPagePath(path), true);
  });
}
for (const path of ['/', '/rules', '/demo', '/admin', '/nope', '/teams/extra']) {
  test(path + ' is not in the known app page set', () => {
    assert.equal(isKnownAppPagePath(path), false);
  });
}

test('the not-found page escapes a hostile path', () => {
  const html = renderNotFoundPage('<script>alert(1)</script>');
  assert.equal(html.includes('<script>alert'), false);
  const escaped = '&' + 'lt;script' + '&' + 'gt;';
  assert.equal(html.includes(escaped), true);
  assert.match(html, /This dog lost the rack/);
});

test('the shell wraps a fragment and keeps the league name', () => {
  const html = decorateHtmlWithShell('<html><body><p>Hello</p></body></html>', '/schedule');
  assert.match(html, /Hello/);
  assert.match(html, /Fremont/);
});

for (const value of [null, undefined, 0, false, { message: 'nope' }]) {
  test('friendly error handles ' + JSON.stringify(value), () => {
    const text = friendlyErrorMessage(value);
    assert.equal(typeof text, 'string');
    assert.ok(text.length > 0);
  });
}
