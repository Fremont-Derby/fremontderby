import test from 'node:test';
import assert from 'node:assert/strict';
import { auditEvent, messageChannels, moderationItem, reopenGate, rosterAssignment, rackWin } from '../src/rackOps.js';

test('a rack win advances the score', () => {
  assert.equal(rackWin({ racks: 1 }, true).score.racks, 2);
  assert.equal(rackWin({ racks: 1 }, false).score.racks, 1);
});

test('a human fail reopens the gate', () => {
  assert.equal(reopenGate({ humanFail: true }).open, true);
});

test('an audit event names the actor and the action', () => {
  assert.equal(auditEvent({ actor: 'Mina', action: 'corrected the score' }).text, 'Mina corrected the score.');
  assert.equal(auditEvent({ actor: 'Mina' }), null);
});

test('a reported message is queued', () => {
  assert.equal(moderationItem({ status: 'reported' }).queued, true);
});

test('roster assignment needs a team and a player', () => {
  assert.equal(rosterAssignment('Owls', 'Eli').ok, true);
  assert.equal(rosterAssignment('Owls', '').ok, false);
});

test('messages stay on three channels', () => {
  assert.deepEqual(messageChannels(), ['direct', 'team', 'general']);
});
