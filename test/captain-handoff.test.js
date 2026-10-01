import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleSuccessors, transferCaptain } from '../src/captainSandboxPage.js';

const members = [
  { id: 'maya', name: 'Maya Banks', status: 'available', agreed: true, type: 'captain' },
  { id: 'alex', name: 'Alex Monroe', status: 'available', agreed: true, type: 'roster' },
  { id: 'casey', name: 'Casey Morgan', status: 'unavailable', agreed: true, type: 'roster' },
  { id: 'theo', name: 'Theo Martin', status: 'available', agreed: false, type: 'roster' },
];

test('only an available teammate who agreed can take captain', () => {
  assert.deepEqual(eligibleSuccessors(members, 'maya').map(member => member.id), ['alex']);
});

test('confirming the handoff moves captain and drops the former captain role', () => {
  const result = transferCaptain(members, 'maya', 'alex');
  assert.equal(result.ok, true);
  assert.equal(result.captainId, 'alex');
  assert.equal(result.members.find(member => member.id === 'maya').type, 'roster');
  assert.equal(result.members.find(member => member.id === 'alex').type, 'captain');
  assert.equal(transferCaptain(members, 'maya', 'casey').ok, false);
});
