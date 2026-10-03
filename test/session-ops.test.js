import test from 'node:test';
import assert from 'node:assert/strict';
import { fourGateReview, latencyBudget, noticeLink, privateReport, releaseDiff, sessionLane, statusBanner, launchRunbook } from '../src/sessionOps.js';

test('the session lane must match the cookie', () => {
  assert.equal(sessionLane({ lane: 'dru', cookieLane: 'dru' }).ok, true);
  assert.equal(sessionLane({ lane: 'dru', cookieLane: 'gamma' }).ok, false);
});

test('a report keeps the body private', () => {
  assert.match(privateReport({ id: 'r1', body: 'secret' }).text, /private/);
});

test('review starts after four gate findings', () => {
  assert.equal(fourGateReview([1, 2, 3, 4]).due, true);
  assert.equal(fourGateReview([1]).due, false);
});

test('a release diff names files and risk', () => {
  assert.match(releaseDiff({ files: 3, risk: 'low' }).text, /3 files/);
});

test('league night stays inside 500ms', () => {
  assert.equal(latencyBudget(400).ok, true);
  assert.equal(latencyBudget(800).ok, false);
});

test('a banner shows only when it has text', () => {
  assert.equal(statusBanner({ text: 'Delayed.' }).show, true);
  assert.equal(statusBanner({}).show, false);
});

test('a notice without a target falls back to the schedule', () => {
  assert.equal(noticeLink({}).href, '/schedule');
});

test('the runbook names the step', () => {
  assert.equal(launchRunbook('Open the venue.').text, 'Open the venue.');
});
