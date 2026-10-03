import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshSafe, testerFeedback } from '../src/refreshSafe.js';

test('a pending save tells you to wait', () => {
  assert.match(refreshSafe({ pending: true }).text, /Wait for Saved/);
});

test('a second tab names a refresh', () => {
  assert.match(refreshSafe({ saved: true, secondTab: true }).text, /other tab should refresh/);
});

test('tester feedback names the lane and a short revision', () => {
  assert.equal(testerFeedback({ lane: 'DRU', sha: 'abcdef123456' }).text, 'Report a problem on DRU at abcdef1.');
});
