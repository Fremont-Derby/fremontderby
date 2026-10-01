import test from 'node:test';
import assert from 'node:assert/strict';
import { gateEvidence, humanValidation, tddEvidence, validationFixture, validationSupport } from '../src/fixtureOps.js';

test('a fixture does not use direct SQL', () => {
  assert.equal(validationFixture('spring').sql, false);
  assert.equal(validationFixture(''), null);
});

test('gate evidence names the persona and the gate', () => {
  assert.equal(gateEvidence({ name: 'schedule', persona: 'Player' }).text, 'Player checked schedule.');
});

test('support keeps items that have evidence', () => {
  assert.deepEqual(validationSupport([{ name: 'shot', evidence: true }, { name: 'note' }]), ['shot']);
});

test('test evidence is red, green, or refactor', () => {
  assert.equal(tddEvidence('green').ok, true);
  assert.equal(tddEvidence('skip').ok, false);
});

test('human validation uses a known step', () => {
  assert.equal(humanValidation('do the task').text, 'do the task');
});
