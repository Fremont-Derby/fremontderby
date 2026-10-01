import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterDefects, datasetRow, outsideTap, replayCompare, shadowRank } from '../src/learnOps.js';

test('a replay says whether the result matches', () => {
  assert.equal(replayCompare('4-2', '4-2').same, true);
  assert.equal(replayCompare('4-2', '3-2').same, false);
});

test('shadow ranking sorts by score', () => {
  assert.deepEqual(shadowRank([{ name: 'a', score: 1 }, { name: 'b', score: 3 }]), ['b', 'a']);
});

test('a leaked row is dropped', () => {
  assert.equal(datasetRow({ input: 'score', label: 'bug', leak: true }), null);
  assert.equal(datasetRow({ input: 'score', label: 'bug' }).label, 'bug');
});

test('defects cluster by kind', () => {
  assert.equal(clusterDefects([{ kind: 'score' }, { kind: 'score' }]).score, 2);
});

test('an outside tap closes the menu', () => {
  assert.equal(outsideTap(true).open, false);
});
