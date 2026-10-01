import test from 'node:test';
import assert from 'node:assert/strict';
import { completeRuns, markAvailability, replaceTestDrive, scorecardDrive, surveySummary } from '../src/opsPlaySlice.js';

test('the survey summary keeps the five newest notes', () => {
  const summary = surveySummary([{ note: 'clear' }, { note: 'stuck' }]);
  assert.equal(summary.count, 2);
  assert.equal(summary.latest, 'clear');
});

test('test drive opens the mission list', () => {
  assert.equal(replaceTestDrive('test-drive').href, '/missions');
});

test('the run list keeps only finished runs for a lane', () => {
  assert.equal(completeRuns([{ lane: 'dru', finished: true }, { lane: 'dru', finished: false }]).length, 1);
});

test('the scorecard drive names the opponent', () => {
  assert.equal(scorecardDrive({ opponent: 'Rail Owls' }).text, 'Score the match against Rail Owls.');
});

test('availability needs a night and a yes, no, or maybe', () => {
  assert.equal(markAvailability('Eli', 'Tuesday', 'yes').status, 'yes');
  assert.equal(markAvailability('Eli', 'Tuesday', 'later'), null);
});
