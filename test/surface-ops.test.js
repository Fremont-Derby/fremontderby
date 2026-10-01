import test from 'node:test';
import assert from 'node:assert/strict';
import { operationsHealth, playerDetail, profilePolish, rackConfirmation, seasonLifecycle } from '../src/surfaceOps.js';

test('operations names a healthy check', () => {
  assert.equal(operationsHealth({ name: 'schedule', ok: true }).text, 'schedule is healthy.');
  assert.equal(operationsHealth({}).ok, false);
});

test('player detail says eligible or blocked', () => {
  assert.equal(playerDetail({ name: 'Eli', eligible: false }).text, 'Eli is blocked.');
});

test('a season list names draft, open, or closed', () => {
  assert.equal(seasonLifecycle({ name: 'Spring', status: 'open' }).text, 'Spring is open.');
  assert.equal(seasonLifecycle({ name: 'Spring', status: 'other' }), null);
});

test('a rack asks for a score before confirmation', () => {
  assert.equal(rackConfirmation({}).confirmed, false);
  assert.equal(rackConfirmation({ score: '8-7' }).confirmed, true);
});

test('profile polish is ready only with a name and a phone', () => {
  assert.equal(profilePolish({ name: 'Eli', phone: '2065550100' }).ready, true);
  assert.equal(profilePolish({}).ready, false);
});
