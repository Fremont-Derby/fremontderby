import assert from 'node:assert/strict';
import test from 'node:test';

import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('score picker exposes accessible status and useful signed-out actions', () => {
  const html = renderScorePickerPage();

  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /Sign in to score/);
  assert.match(html, /Open Schedule/);
  assert.match(html, /href='\/profile'|href="\/profile"|actionLink\('Sign in to score','\/profile'\)/);
  assert.match(html, /actionLink\('Open Schedule','\/schedule',true\)/);
  assert.doesNotMatch(html, /tonight/i);
});

test('score picker empty state gives next actions instead of a dead end', () => {
  const html = renderScorePickerPage();

  assert.match(html, /Nothing ready to score/);
  assert.match(html, /Check my team/);
  assert.match(html, /actionLink\('Open Schedule','\/schedule'\)/);
  assert.match(html, /actionLink\('Check my team','\/teams',true\)/);
});

test('score picker provides non-color focus and failure feedback', () => {
  const html = renderScorePickerPage();

  assert.match(html, /\.match:focus-visible,\.button:focus-visible/);
  assert.match(html, /Could not load matches/);
  assert.match(html, /Nothing was changed/);
  assert.match(html, /Try again/);
});
