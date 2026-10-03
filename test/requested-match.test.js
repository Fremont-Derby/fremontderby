import test from 'node:test';
import assert from 'node:assert/strict';
import { requestedMatchId, scoreHref, noticeScoreHref, requestedTeamId, requestedScoreDate } from '../src/requestedMatch.js';

test('the score link match id is read from the query', () => {
  assert.equal(requestedMatchId('?match=abc'), 'abc');
  assert.equal(requestedMatchId('?match_id=abc'), 'abc');
  assert.equal(requestedMatchId(''), '');
});

test('a score link keeps the match and the makeup date', () => {
  assert.equal(scoreHref('abc', '2026-10-07'), '/scorecard?match=abc&date=2026-10-07');
  assert.equal(scoreHref('', ''), '/scorecard');
});

test('a score notice keeps its match id', () => {
  assert.equal(noticeScoreHref({ match_id: 'abc' }), '/scorecard?match=abc');
  assert.equal(noticeScoreHref({}), '/scorecard');
});

test('the score link team id is read from the query', () => {
  assert.equal(requestedTeamId('?team=team-1'), 'team-1');
  assert.equal(requestedTeamId(''), '');
});

test('the score link date is read from the query', () => {
  assert.equal(requestedScoreDate('?date=2026-10-07'), '2026-10-07');
  assert.equal(requestedScoreDate(''), '');
});
