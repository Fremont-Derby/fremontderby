import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupeNotices, expireNotice, nightBudget, notificationEvents, statusText } from '../src/noticeRules.js';

test('only named league events create notices', () => {
  assert.ok(notificationEvents().includes('match-tonight'));
});

test('an old notice expires', () => {
  assert.equal(expireNotice({ until: 5 }, 9).active, false);
  assert.equal(expireNotice({ until: 12 }, 9).active, true);
});

test('the same event for the same match is kept once', () => {
  assert.equal(dedupeNotices([{ event: 'score-disputed', match: 'a' }, { event: 'score-disputed', match: 'a' }]).length, 1);
});

test('league night stays inside 500 milliseconds', () => {
  assert.equal(nightBudget(700).ok, false);
});

test('a status has words, not only a color', () => {
  assert.equal(statusText('bad').text, 'Blocked');
  assert.equal(statusText('bad').colorOnly, false);
});
