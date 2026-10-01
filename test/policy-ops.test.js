import test from 'node:test';
import assert from 'node:assert/strict';
import { defectGate, deleteEntity, requiredBindings, ruleDecision, secretHits } from '../src/policyOps.js';

test('each lane lists the bindings it needs', () => {
  assert.ok(requiredBindings('dru').includes('SUPABASE_URL'));
  assert.deepEqual(requiredBindings('unknown'), []);
});

test('a night-blocking defect fails the gate', () => {
  assert.equal(defectGate({ blocksNight: true }).gate, 'fail');
  assert.equal(defectGate({ blocksNight: false }).gate, 'follow-up');
});

test('a rule decision names the rule and the impact', () => {
  assert.equal(ruleDecision({ rule: 'one captain', impact: 'blocks a second team' }).text, 'one captain: blocks a second team');
  assert.equal(ruleDecision({ rule: 'one captain' }), null);
});

test('match history blocks a hard delete', () => {
  assert.equal(deleteEntity({ matches: 2 }).deleted, false);
  assert.equal(deleteEntity({ matches: 0 }).deleted, true);
});

test('a private key pattern is flagged', () => {
  assert.deepEqual(secretHits('BEGIN PRIVATE KEY'), ['secret-pattern']);
  assert.deepEqual(secretHits('hello'), []);
});
