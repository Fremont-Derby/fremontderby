import test from 'node:test';
import assert from 'node:assert/strict';
import { draftSeason, publicShell, registrationPayment, signInProfile, teamInvite } from '../src/gateChecks.js';

test('the public shell needs home, rules, and navigation', () => {
  assert.equal(publicShell({ home: true, rules: true, nav: true }).ok, true);
  assert.equal(publicShell({ home: true }).ok, false);
});

test('sign-in needs a profile', () => {
  assert.equal(signInProfile({ signedIn: true, profile: 'Eli' }).ok, true);
  assert.equal(signInProfile({ signedIn: false }).ok, false);
});

test('a draft season needs a name', () => {
  assert.equal(draftSeason({ status: 'draft', name: 'Spring' }).ok, true);
});

test('registration can be unpaid', () => {
  assert.match(registrationPayment({ registered: true, paid: false }).text, /not marked/);
});

test('an invite needs a team and a player', () => {
  assert.equal(teamInvite({ team: 'Owls', player: 'Eli' }).ok, true);
  assert.equal(teamInvite({ team: 'Owls' }).ok, false);
});
