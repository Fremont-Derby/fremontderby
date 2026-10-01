import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupeNotices, launchReady, restoreProof, roleBoundary, tapTarget, usabilityGap, writeState } from '../src/noticeGuard.js';

test('the same event is not shown twice', () => {
  assert.equal(dedupeNotices([{ eventId: 'e1' }, { eventId: 'e1' }]).length, 1);
});

test('a backup must be restored and served', () => {
  assert.equal(restoreProof({ restored: true, served: true }).ok, true);
  assert.equal(restoreProof({ restored: true }).ok, false);
});

test('a write says saved, saving, or failed', () => {
  assert.equal(writeState('failed'), 'Failed. Try again.');
  assert.equal(writeState('pending'), 'Saving.');
});

test('a tap target is at least 44', () => {
  assert.equal(tapTarget(44).ok, true);
  assert.equal(tapTarget(20).ok, false);
});

test('a player cannot do an admin action', () => {
  assert.equal(roleBoundary({ role: 'player' }, 'delete').ok, false);
  assert.equal(roleBoundary({ role: 'admin' }, 'delete').ok, true);
});

test('launch waits for every check', () => {
  assert.equal(launchReady([{ ok: true }, { ok: false }]).ok, false);
});

test('a control needs a label', () => {
  assert.equal(usabilityGap({}).text, 'Name the control.');
});
