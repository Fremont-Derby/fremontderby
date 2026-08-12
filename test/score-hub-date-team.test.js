import assert from 'node:assert/strict';
import test from 'node:test';

import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('Score starts from today and offers human-readable date and team context without changing authorization', () => {
  const html = renderScorePickerPage();

  assert.match(html, /Start with today, then switch dates or teams/);
  assert.match(html, /data-date/);
  assert.match(html, /data-team/);
  assert.match(html, /Today ·/);
  assert.match(html, /localDateKey\(\)/);
  assert.match(html, /match\.scheduled_on\|\|'tbd'/);
  assert.match(html, /match\.scoring_team_id/);
  assert.match(html, /match\.scoring_team_name/);
  assert.match(html, /All my teams/);
  assert.match(html, /\/api\/me\/scorable-matches/);
  assert.match(html, /\/scorecard\/live\?match=/);
  assert.match(html, /Choose another date or team above/);
  assert.doesNotMatch(html, /tonight/i);
  assert.doesNotMatch(html, /Match ID<input/i);
  assert.doesNotMatch(html, /Access token<input/i);
});

test('Score filters only the already-authorized scorable options returned by the server', () => {
  const html = renderScorePickerPage();

  assert.match(html, /const visible=matches\.filter\(match=>\(match\.scheduled_on\|\|'tbd'\)===selectedDate\)/);
  assert.match(html, /selectedTeam==='all'\|\|text\(match\.scoring_team_id\)===selectedTeam/);
  assert.match(html, /filtersEl\.hidden=false/);
  assert.match(html, /dateSelect\.addEventListener\('change',renderMatches\)/);
  assert.match(html, /teamSelect\.addEventListener\('change',renderMatches\)/);
});
