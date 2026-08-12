import assert from 'node:assert/strict';
import test from 'node:test';

import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('Score exposes human-readable matchup and revealed-race selectors from authorized rows', () => {
  const html = renderScorePickerPage();

  assert.match(html, /data-matchup/);
  assert.match(html, /aria-label="Team matchup"/);
  assert.match(html, /data-race/);
  assert.match(html, /aria-label="Revealed race"/);
  assert.match(html, /function matchupLabel\(match\).*team_a_name.*team_b_name.*round_number/s);
  assert.match(html, /function raceLabel\(match\).*slot_number.*player_a_name.*player_b_name/s);
  assert.match(html, /text\(match\.team_match_id\)/);
  assert.match(html, /text\(match\.player_match_id\)/);
  assert.doesNotMatch(html, /Team matchup ID/);
  assert.doesNotMatch(html, /Player match ID/);
});

test('revealed fixed pairings can be selected in any order without rewriting opponents', () => {
  const html = renderScorePickerPage();

  assert.match(html, /const races=baseMatches\(\)\.filter\(match=>text\(match\.team_match_id\)===matchupId\)/);
  assert.match(html, /for\(const match of races\)addOption\(raceSelect,text\(match\.player_match_id\),raceLabel\(match\)\)/);
  assert.match(html, /raceSelect\.addEventListener\('change',renderSelection\)/);
  assert.match(html, /Choose any pairing to score next/);
  assert.match(html, /player_a_name\)+' vs '\+text\(match\.player_b_name\)/);
  assert.doesNotMatch(html, /slot_number\+1/);
  assert.doesNotMatch(html, /nextSlot|currentSlot|must play/i);
});

test('selected race opens the existing live scorer with explicit scoring-team context', () => {
  const html = renderScorePickerPage();

  assert.match(html, /function liveHref\(match\)/);
  assert.match(html, /\/scorecard\/live\?match=/);
  assert.match(html, /match\.scoring_team_id/);
  assert.match(html, /match\.scoring_team_name/);
  assert.match(html, /listEl\.append\(matchCard\(selected\)\)/);
});

test('matchup and race selectors remain phone-friendly', () => {
  const html = renderScorePickerPage();

  assert.match(html, /\.filters select\{[^}]*min-height:46px/);
  assert.match(html, /@media\(max-width:600px\)\{[^}]*\.filters\{grid-template-columns:1fr\}/);
});
