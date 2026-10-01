import test from 'node:test';
import assert from 'node:assert/strict';
import { dateStatus, finishedMatchups, levelResult, missionFrame, scoringControls } from '../src/framePlaySlice.js';

test('a finished mission says it is complete', () => {
  assert.equal(missionFrame({ done: true }).text, 'Mission complete.');
  assert.equal(missionFrame({ task: 'Find your match' }).complete, false);
});

test('a level result is obvious only when the level is finished', () => {
  assert.equal(levelResult({ name: 'Rack 1', finished: true }).text, 'Level Rack 1 is complete.');
  assert.equal(levelResult({ name: 'Rack 1' }).obvious, false);
});

test('selected rack controls stay visible', () => {
  assert.equal(scoringControls({ rack: 2 }).visible, true);
  assert.equal(scoringControls({}).visible, false);
});

test('the schedule lists finished matchups and their points', () => {
  const rows = finishedMatchups([{ matchup: 'Owls vs Sharks', points: 3, finished: true }, { matchup: 'later', finished: false }]);
  assert.deepEqual(rows, [{ matchup: 'Owls vs Sharks', points: 3 }]);
});

test('check-in is a date and a status, not a dropdown', () => {
  assert.deepEqual(dateStatus([{ date: 'Tue', status: 'yes' }]), ['Tue: yes']);
});
