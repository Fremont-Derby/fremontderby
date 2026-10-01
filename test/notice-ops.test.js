import test from 'node:test';
import assert from 'node:assert/strict';
import { captainPhone, noticeState, rackWin, readOnlyMode, releaseReady } from '../src/noticeOps.js';

test('a notice says whether it is handled', () => {
  assert.equal(noticeState({ title: 'Lineup', done: true }).state, 'done');
  assert.equal(noticeState({}), null);
});

test('a captain phone is hidden from a player', () => {
  assert.equal(captainPhone({ role: 'player' }, '2065550100').visible, false);
  assert.equal(captainPhone({ role: 'admin' }, '2065550100').visible, true);
});

test('read-only mode blocks writes', () => {
  assert.equal(readOnlyMode(true).writes, false);
});

test('release readiness names the first failed gate', () => {
  assert.equal(releaseReady([{ name: 'schedule', ok: false }]).text, 'schedule is not ready.');
  assert.equal(releaseReady([{ name: 'schedule', ok: true }]).ready, true);
});

test('a rack win advances that side and unlocks the next rack', () => {
  const next = rackWin({ score: { Owls: 1 } }, { winner: 'Owls' });
  assert.equal(next.score.Owls, 2);
  assert.equal(next.unlocked, true);
});
