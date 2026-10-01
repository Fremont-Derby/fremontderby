import test from 'node:test';
import assert from 'node:assert/strict';
import { dualScorecard, editLineup, lineupLock, playerSearch, privacyLabel } from '../src/lineupOps.js';

test('both teams are named before a dual scorecard is valid', () => {
  assert.equal(dualScorecard({ team: 'Owls' }, { team: 'Sharks' }).valid, true);
  assert.equal(dualScorecard({ team: 'Owls' }, {}).valid, false);
});

test('editing a lineup unsubmits it', () => {
  assert.equal(editLineup({ order: ['Eli', 'Mina'] }).submitted, false);
});

test('telemetry keeps the kind and drops the player name', () => {
  assert.equal(privacyLabel({ kind: 'rack-saved', playerName: 'Eli' }), null);
  assert.equal(privacyLabel({ kind: 'rack-saved' }).text, 'rack-saved is recorded without a player name.');
});

test('the lineup locks only after both captains submit', () => {
  assert.equal(lineupLock([{ submitted: true }, { submitted: false }]).editable, true);
  assert.equal(lineupLock([{ submitted: true }, { submitted: true }]).editable, false);
});

test('the player directory searches by name', () => {
  assert.equal(playerSearch([{ name: 'Eli Banks' }, { name: 'Mina Reed' }], 'mina').length, 1);
});
