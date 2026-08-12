import assert from 'node:assert/strict';
import test from 'node:test';

import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('Score reuses captain team lineup contexts for pre-score preparation', () => {
  const html = renderScorePickerPage();

  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /body\?\.teamManagement\?\.captain_teams/);
  assert.match(html, /team\.lineupRounds/);
  assert.match(html, /function baseCaptainContexts\(\)/);
  assert.match(html, /context\.scheduledOn\|\|'tbd'/);
  assert.match(html, /context\.teamMatchId/);
  assert.match(html, /captainMatchupLabel\(context\)/);
});

test('unrevealed captain matchup deep-links to the existing lineup workflow with team and round context', () => {
  const html = renderScorePickerPage();

  assert.match(html, /function lineupHref\(context\)/);
  assert.match(html, /\/lineup\?team=/);
  assert.match(html, /context\.teamId/);
  assert.match(html, /context\.roundId/);
  assert.match(html, /Prepare lineup/);
  assert.match(html, /dated availability, find substitutes, and lock your three/);
  assert.match(html, /Opponent order stays hidden until both teams submit/);
});

test('captain preparation does not create a second scoring authorization path', () => {
  const html = renderScorePickerPage();

  assert.match(html, /function liveHref\(match\)/);
  assert.match(html, /matches=body\.matches\|\|\[\]/);
  assert.match(html, /const races=baseMatches\(\)\.filter\(match=>text\(match\.team_match_id\)===matchupId\)/);
  assert.doesNotMatch(html, /liveHref\(context\)|player_match_id:context|scoring_team_id:context/);
});

test('captain context is optional so scoring still loads if team-management enrichment is unavailable', () => {
  const html = renderScorePickerPage();

  assert.match(html, /fetch\('\/api\/me\/teams'.*\.catch\(\(\)=>null\)/s);
  assert.match(html, /flattenCaptainContexts\(teamBody\)/);
});
