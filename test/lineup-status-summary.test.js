import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('top context keeps only the useful concrete opponent status', () => {
  const html = renderLineupPage();

  assert.match(html, /aria-label="Opponent lineup status"/);
  assert.match(html, /class="matchup-side matchup-side-opponent"/);
  assert.match(html, /class="side-kicker">Opponent<\/p>/);
  assert.match(html, /data-opponent-lineup-label>Opponent team<\/h2>/);
  assert.match(html, /data-opponent-lineup-status data-state="missing">Not submitted<\/div>/);
  assert.doesNotMatch(html, /class="matchup-side matchup-side-own"/);
  assert.doesNotMatch(html, /data-own-lineup-label/);
  assert.doesNotMatch(html, /data-matchup-primary/);
  assert.doesNotMatch(html, /class="versus"/);
});

test('the selected-player panels are the single home for own lineup state', () => {
  const html = renderLineupPage();

  assert.equal((html.match(/data-own-selection-label/g) || []).length, 3);
  assert.equal((html.match(/data-own-selection-status/g) || []).length, 3);
  assert.match(html, /Not submitted · editable/);
  assert.match(html, /Submitted · editable/);
  assert.match(html, /Not submitted · will lock/);
  assert.match(html, /data-state="locked"/);
  assert.match(html, /ownName\+' selections'/);
  assert.match(html, /ownName\+' lineup: '\+label/);
});

test('selection copy names both teams and explains edit withdrawal and lock boundary', () => {
  const html = renderLineupPage();

  assert.match(html, /opponentName\+' has submitted\. Submitting '\+ownName\+' now locks and reveals both lineups\.'/);
  assert.match(html, /'Choose all three slots, then submit '\+ownName\+'\.'/);
  assert.match(html, /ownName\+' is submitted\. Changing any slot will withdraw it and require you to submit again\.'/);
  assert.match(html, /ownName\+' and '\+opponentName\+' are locked and revealed\.'/);
  assert.match(html, /ownTeamName:\(\)=>activeTeam\(\)\?\.teamName/);
  assert.match(html, /opponentTeamName:\(\)=>activeRound\(\)\?\.opponentName/);
});

test('submit controls require a fresh submit or warn when it will lock both lineups', () => {
  const html = renderLineupPage();

  assert.match(html, /return'Submit & lock both lineups'/);
  assert.match(html, /return ownSubmitted\?'Submitted · edit to change':'Submit lineup'/);
  assert.match(html, /mobileSubmitButton\.disabled=lineupLocked\|\|ownSubmitted\|\|filled!==3/);
  assert.match(html, /submitButton\.disabled=lineupLocked\|\|ownSubmitted\|\|filled!==3/);
  assert.match(html, /mobileSubmitButton\.textContent=submissionActionLabel\(\)/);
  assert.match(html, /submitButton\.textContent=submissionActionLabel\(\)/);
  assert.match(html, /Submitting now will lock and reveal both lineups\. Continue\?/);
});

test('one-team captains keep the compact opponent card and mobile selection workspace', () => {
  const html = renderLineupPage();

  assert.match(html, /teamField\.hidden=captainTeams\.length===1/);
  assert.match(html, /\.matchup-stage\{padding:12px\}/);
  assert.match(html, /\.matchup-side-opponent\{border-left:6px solid var\(--gold\)/);
  assert.match(html, /\.side-name\{[^}]*overflow-wrap:anywhere/);
  assert.match(html, /\.lineup-panel \.submission-state,\.mobile-lineup-summary \.submission-state\{display:none\}/);
  assert.match(html, /\.mobile-lineup-summary\{[^}]*background:rgba\(255,255,255,\.98\)!important/);
});
