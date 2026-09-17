import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPlayoffsPage } from '../src/playoffsPage.js';

test('playoffs page still has empty-state and next-match wire', () => {
  const html = renderPlayoffsPage();
  assert.match(html, /Fremont Derby Playoffs/);
  assert.match(html, /data-playoff-empty/);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
  assert.doesNotMatch(html, /Propose trade/);
});
