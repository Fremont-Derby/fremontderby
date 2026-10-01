import test from 'node:test';
import assert from 'node:assert/strict';
import { adminHub, destructiveAction, messageScroll, rackLedger, statusBanner } from '../src/hubOps.js';

test('the admin hub keeps only links with a destination', () => {
  assert.equal(adminHub([{ label: 'Teams', href: '/teams' }, { label: 'Broken' }]).length, 1);
});

test('the rack ledger numbers each rack', () => {
  assert.equal(rackLedger([{ score: '8-7' }])[0].rack, 1);
});

test('a destructive action names the consequence', () => {
  assert.match(destructiveAction({ name: 'Close season', consequence: 'lock the schedule' }).text, /lock/);
  assert.equal(destructiveAction({ name: 'Close season' }), null);
});

test('a status banner is hidden when there is no message', () => {
  assert.equal(statusBanner('').visible, false);
  assert.equal(statusBanner('Tables moved').visible, true);
});

test('the message pane scrolls', () => {
  assert.equal(messageScroll([{ id: 1 }]).scrolls, true);
});
