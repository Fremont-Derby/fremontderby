import test from 'node:test';
import assert from 'node:assert/strict';
import { agingReview, destructiveAction, factSource, gateDefect, rackLedger, requiredBindings, workflowHealth } from '../src/ledgerOps.js';

test('the rack ledger numbers each rack', () => {
  assert.equal(rackLedger([{ winner: 'Owls' }])[0].n, 1);
});

test('workflow health names the five surfaces', () => {
  assert.equal(workflowHealth({ auth: true }).length, 5);
  assert.equal(workflowHealth({ auth: true })[0].ok, true);
});

test('each lane lists the required binding names', () => {
  assert.equal(requiredBindings('dru')[0].name, 'SUPABASE_URL');
});

test('only a blocking defect fails the gate', () => {
  assert.equal(gateDefect({ severity: 'block' }).fails, true);
  assert.equal(gateDefect({ severity: 'follow' }).fails, false);
});

test('a 90-day item needs review', () => {
  assert.equal(agingReview({ ageDays: 90 }).review, true);
  assert.equal(agingReview({ ageDays: 10 }).review, false);
});

test('a destructive action names the consequence', () => {
  assert.equal(destructiveAction({}).ok, false);
  assert.match(destructiveAction({ consequence: 'Deletes the team.' }).text, /Deletes/);
});

test('a fact names its source', () => {
  assert.equal(factSource({ name: 'paid', source: 'registration' }).text, 'paid comes from registration.');
  assert.equal(factSource({ name: 'paid' }), null);
});
