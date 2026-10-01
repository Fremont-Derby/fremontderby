import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInTable, missionChrome, mockSeason, scheduleAfterSeason, scheduleRow } from '../src/scheduleOps.js';

test('mission chrome names the task, the survey, and the stop control', () => {
  const chrome = missionChrome({ task: 'Find your match' });
  assert.equal(chrome.abort, 'Stop this mission');
  assert.match(chrome.survey, /survey/);
});

test('a finished match shows the score and hides messages', () => {
  assert.equal(scheduleRow({ finished: true, score: '4-2' }).messages, false);
  assert.equal(scheduleRow({ finished: false }).messages, true);
});

test('the schedule waits for a season, then loads', () => {
  assert.equal(scheduleAfterSeason(null).loaded, false);
  assert.equal(scheduleAfterSeason('spring').loaded, true);
});

test('check-in is one status table', () => {
  assert.deepEqual(checkInTable([{ name: 'Eli', status: 'yes' }]), [{ name: 'Eli', status: 'yes' }]);
});

test('a mock season keeps a short team list for lineup', () => {
  assert.equal(mockSeason({ id: 'demo', teams: [1, 2, 3, 4, 5] }).teams.length, 4);
});
