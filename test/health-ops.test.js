import test from 'node:test';
import assert from 'node:assert/strict';
import { knownIssues, provenance, releaseDiff, topErrors, workflowHealth } from '../src/healthOps.js';

test('workflow health names each check', () => {
  assert.equal(workflowHealth([{ name: 'score', ok: true }])[0].ok, true);
});

test('known issues hide blocking ones', () => {
  assert.deepEqual(knownIssues([{ title: 'scroll', blocking: false }, { title: 'down', blocking: true }]), ['scroll']);
});

test('a release diff counts the changes', () => {
  assert.equal(releaseDiff(['a', 'b']).count, 2);
  assert.match(releaseDiff([]).text, /No changes/);
});

test('top errors keeps the three largest', () => {
  assert.equal(topErrors([{ count: 1 }, { count: 4 }, { count: 2 }, { count: 3 }]).length, 3);
});

test('a fact names its source', () => {
  assert.equal(provenance({ name: 'rating', source: 'matches' }).text, 'rating comes from matches.');
  assert.equal(provenance({ name: 'rating' }), null);
});
