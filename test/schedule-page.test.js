import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSchedulePage } from '../src/schedulePage.js';

test('schedule page makes the current league night obvious without technical inputs', () => {
  const html = renderSchedulePage();

  assert.match(html, /Fremont Derby Schedule/);
  assert.match(html, /data-season-select/);
  assert.match(html, /data-round-select/);
  assert.match(html, /Next league night/);
  assert.match(html, /data-match-list/);
  assert.match(html, /teamAName/);
  assert.match(html, /teamBName/);
  assert.match(html, /Table /);
  assert.match(html, /href='\/scorecard'|href="\/scorecard"/);
  assert.match(html, /\/messages\?matchup=/);
  assert.match(html, /\/api\/seasons/);
  assert.match(html, /\/schedule/);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Round ID</i);
  assert.doesNotMatch(html, /data-token/);
});
