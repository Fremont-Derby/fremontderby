import test from 'node:test';
import assert from 'node:assert/strict';
import { harnessMission, learningLoop, mismatchRecovery, playwrightPlan, teamBrief } from '../src/proofOps.js';

test('the playwright plan has three steps', () => {
  assert.equal(playwrightPlan().length, 3);
});

test('a mismatch asks for the rack to be checked', () => {
  assert.equal(mismatchRecovery({ mismatch: true }).blocked, true);
  assert.equal(mismatchRecovery({}).blocked, false);
});

test('a defect is recorded for replay', () => {
  assert.match(learningLoop({ id: 12 }).text, /12/);
  assert.equal(learningLoop({}), null);
});

test('a harness mission names the persona and the task', () => {
  assert.equal(harnessMission({ persona: 'Player', task: 'Find your match' }).text, 'Player: Find your match');
});

test('a team brief names the team and the captain', () => {
  assert.equal(teamBrief({ name: 'Owls', captain: 'Mina' }).text, 'You play for Owls, captain Mina.');
});
