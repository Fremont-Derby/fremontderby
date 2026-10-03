import test from 'node:test';
import assert from 'node:assert/strict';
import { blockerList, nextAction, peelPages, readyToPort, rulesetNames } from '../src/reconcileOps.js';

test('only proven product slices are ready to port', () => {
  assert.deepEqual(readyToPort([{ name: 'score', proven: true }, { name: 'seed', proven: true, druOnly: true }]), ['score']);
});

test('ruleset names stay on the four lanes', () => {
  assert.ok(rulesetNames().includes('fremontderby-dru'));
});

test('an empty page has one next action', () => {
  assert.equal(nextAction({ action: 'Add a team' }).text, 'Add a team');
  assert.equal(nextAction({ items: [1] }), null);
});

test('the blocker list keeps human blockers', () => {
  assert.deepEqual(blockerList([{ name: 'ruleset', human: true }, { name: 'test', human: false }]), ['ruleset']);
});

test('the peel list names the main pages', () => {
  assert.ok(peelPages().includes('profile'));
});
