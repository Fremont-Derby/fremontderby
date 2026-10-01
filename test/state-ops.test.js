import test from 'node:test';
import assert from 'node:assert/strict';
import { gateRegression, leagueState, roleBoundary, validationData, writeOnce } from '../src/stateOps.js';

test('an archived season cannot be open', () => {
  assert.equal(leagueState({ archived: true, status: 'open' }).ok, false);
  assert.equal(leagueState({ status: 'open' }).ok, true);
});

test('validation data is not real standings', () => {
  assert.equal(validationData({ validation: true }).real, false);
});

test('a player cannot manage the team', () => {
  assert.equal(roleBoundary({ role: 'player' }, 'manage').allowed, false);
  assert.equal(roleBoundary({ role: 'captain' }, 'manage').allowed, true);
});

test('the same write is saved once', () => {
  assert.equal(writeOnce('score-1', new Set(['score-1'])).saved, false);
  assert.equal(writeOnce('score-1', new Set()).saved, true);
});

test('a passed gate still has a regression check', () => {
  assert.equal(gateRegression({ name: 'schedule', passed: true }).passed, true);
});
