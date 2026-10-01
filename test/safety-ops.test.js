import test from 'node:test';
import assert from 'node:assert/strict';
import { bracketMatch, dataInventory, finalizedEdit, logLine, runnerReady, safeError, stableRead, tabState } from '../src/safetyOps.js';

test('a player cannot edit a finished result', () => {
  assert.equal(finalizedEdit({ final: true }, { role: 'player' }).allowed, false);
  assert.equal(finalizedEdit({ final: true }, { role: 'admin' }).allowed, true);
});

test('a log line cannot carry a phone', () => {
  assert.equal(logLine({ phone: '2065550100' }).ok, false);
  assert.equal(logLine({ event: 'saved' }).ok, true);
});

test('inventory keeps only personal fields that exist', () => {
  assert.deepEqual(dataInventory({ name: 'Eli' }).fields, ['name']);
});

test('a second tab cannot overwrite an unsaved edit', () => {
  assert.equal(tabState([{ saved: false }, { saved: true }]).ok, false);
});

test('a public error does not leak the stack', () => {
  assert.equal(safeError({ public: 'Try again.', ref: 'e1' }).text, 'Try again.');
});

test('a playoff match needs both teams', () => {
  assert.equal(bracketMatch({ home: 'Owls', away: 'Sharks' }).ready, true);
  assert.equal(bracketMatch({ home: 'Owls' }).ready, false);
});

test('the runner must be hosted', () => {
  assert.equal(runnerReady({ hosted: false }).ok, false);
});

test('a stable read cannot write', () => {
  assert.equal(stableRead({ writes: true }).ok, false);
});
