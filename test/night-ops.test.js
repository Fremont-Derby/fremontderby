import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibilityReason, leagueNightSteps, manualScore, restoreBackup, sessionLane } from '../src/nightOps.js';

test('a blocked player gets the reason', () => {
  assert.equal(eligibilityReason({ eligible: false, reason: 'No team' }).text, 'No team');
  assert.equal(eligibilityReason({ eligible: true }).text, 'Eligible.');
});

test('a session names its lane', () => {
  assert.equal(sessionLane('lane=dru').lane, 'dru');
  assert.equal(sessionLane('').lane, null);
});

test('league night has four steps', () => {
  assert.equal(leagueNightSteps().length, 4);
});

test('a manual score can be entered again later', () => {
  assert.match(manualScore('owls-sharks', '4-2').text, /later re-entry/);
  assert.equal(manualScore('owls-sharks'), null);
});

test('a production backup is not restored here', () => {
  assert.equal(restoreBackup({ lane: 'prod' }).restored, false);
  assert.equal(restoreBackup({ lane: 'dru' }).restored, true);
});
