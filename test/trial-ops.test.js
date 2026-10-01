import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastPair, profileRetest, publicSurface, seasonTrial, teamMission } from '../src/trialOps.js';

test('the season trial needs two captains', () => {
  assert.equal(seasonTrial({ captains: 2, season: 1 }).ok, true);
  assert.equal(seasonTrial({ captains: 1, season: 1 }).ok, false);
});

test('a public surface must return 200', () => {
  assert.equal(publicSurface({ name: 'schedule', status: 200 }).ok, true);
  assert.equal(publicSurface({ name: 'schedule', status: 500 }).ok, false);
});

test('the team mission names the team and the captain', () => {
  assert.equal(teamMission({ name: 'Owls', captain: 'Mina' }).ok, true);
  assert.equal(teamMission({ name: 'Owls' }).ok, false);
});

test('check-in names the person and the status', () => {
  assert.equal(contrastPair({ name: 'Eli', status: 'yes' }).ok, true);
});

test('profile retest needs a name and a phone', () => {
  assert.equal(profileRetest({ name: 'Eli', phone: '2065550100' }).ready, true);
});
