import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPracticePage } from '../src/practicePage.js';

test('practice page points at the next published night on Schedule', () => {
  const html = renderPracticePage();
  assert.match(html, /data-fd-dru-practice/);
  assert.match(html, /data-next-match/);
  assert.match(html, /href="\/schedule">Schedule</);
  assert.match(html, /next published night/i);
});
