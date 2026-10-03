import test from 'node:test';
import assert from 'node:assert/strict';
import { leagueAdmin, personaSelector, playerSearchEdit, prizeSummary, seasonSetupSteps } from '../src/adminOps.js';

test('the persona selector is for JFL or Gamma testing', () => {
  assert.equal(personaSelector('gamma').lane, 'gamma');
  assert.equal(personaSelector('prod'), null);
});

test('an admin can manage only their own league', () => {
  assert.equal(leagueAdmin({ league: 'fremont' }, 'fremont').allowed, true);
  assert.equal(leagueAdmin({ league: 'fremont' }, 'other').allowed, false);
});

test('player management searches by name', () => {
  assert.equal(playerSearchEdit([{ name: 'Eli Banks' }], 'eli').length, 1);
});

test('season setup is three guided steps', () => {
  assert.equal(seasonSetupSteps().length, 3);
});

test('the prize page totals the payout', () => {
  assert.equal(prizeSummary([{ amount: 20 }, { amount: 10 }]).total, 30);
});
