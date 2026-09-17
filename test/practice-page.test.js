import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPracticePage } from '../src/practicePage.js';

test('practice page loads next published night from /api/me/matches', () => {
  const html = renderPracticePage();
  assert.match(html, /data-fd-dru-practice/);
  assert.match(html, /data-next-match/);
  assert.match(html, /href="\/schedule">Schedule</);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});
