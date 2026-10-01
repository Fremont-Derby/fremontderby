import test from 'node:test';
import assert from 'node:assert/strict';
import { gammaBypass, historicalRow, privacyHold, simplePage, skinEntry, throttleStep } from '../src/integrityOps.js';

test('a historical result cannot be edited', () => {
  assert.equal(historicalRow({ historical: true }, true).allowed, false);
  assert.equal(historicalRow({ historical: false }, true).allowed, true);
});

test('a skin needs a name and a lane', () => {
  assert.equal(skinEntry({ name: 'Night', lane: 'dru' }).text, 'Night is a dru skin.');
  assert.equal(skinEntry({ name: 'Night' }), null);
});

test('a simple page has one action', () => {
  assert.equal(simplePage({ actions: ['Add a team'] }).ok, true);
  assert.equal(simplePage({ actions: ['Add', 'Edit'] }).ok, false);
});

test('gamma bypass stays off', () => {
  assert.equal(gammaBypass({ lane: 'gamma', bypass: true }).ok, false);
  assert.equal(gammaBypass({ lane: 'dru', bypass: true }).ok, true);
});

test('raising the limit is a human step', () => {
  assert.equal(throttleStep(100).human, true);
});

test('public pages do not list phone or email', () => {
  assert.deepEqual(privacyHold({ phone: '2065550100', name: 'Eli' }).fields, ['phone']);
});
