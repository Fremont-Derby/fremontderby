import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneDrift, closeKeyword, emptyState, laneBase, smokeException } from '../src/laneOps.js';

test('staging drift names the missing read model', () => {
  assert.equal(cloneDrift(['teams', 'scores'], ['teams']).missing[0], 'scores');
});

test('health is the release-smoke exception', () => {
  assert.match(smokeException('/health').text, /without a manual click/);
});

test('each lane names its base branch', () => {
  assert.equal(laneBase('dru').base, 'fremontderby-dru');
  assert.equal(laneBase('other').base, null);
});

test('an empty page has one next action', () => {
  assert.equal(emptyState({ action: 'Add a team' }).action, 'Add a team');
  assert.equal(emptyState({ items: [1] }), null);
});

test('a close keyword is flagged', () => {
  assert.equal(closeKeyword('Closes #12').closes, true);
  assert.equal(closeKeyword('Tracks #12').closes, false);
});
