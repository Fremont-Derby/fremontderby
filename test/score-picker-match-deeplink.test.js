import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('Score honors a Schedule team-match deep link without bypassing authorization', () => {
  const html = renderScorePickerPage();

  assert.match(html, /new URLSearchParams\(location\.search\)\.get\('match'\)/);
  assert.match(html, /item\.team_match_id\)===requestedMatch/);
  assert.match(html, /item\.teamMatchId\)===requestedMatch/);
  assert.match(html, /matchupSelect\.value=requestedMatch/);
  assert.match(html, /populateRaces\(\)/);
  assert.match(html, /\/api\/me\/scorable-matches/);
  assert.match(html, /\/api\/me\/teams/);
  assert.doesNotMatch(html, /fetch\([^\n]*requestedMatch/);
});
