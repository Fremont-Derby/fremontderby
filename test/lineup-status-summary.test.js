import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup makes the two concrete matchup sides the visual anchor', () => {
  const html = renderLineupPage();

  assert.match(html, /aria-label="Matchup lineup status"/);
  assert.match(html, /class="matchup-side matchup-side-own"/);
  assert.match(html, /class="side-kicker">Your team<\/p>/);
  assert.match(html, /data-own-lineup-label>Your team<\/h2>/);
  assert.match(html, /class="versus" aria-hidden="true">VS<\/div>/);
  assert.match(html, /class="matchup-side matchup-side-opponent"/);
  assert.match(html, /class="side-kicker">Opponent<\/p>/);
  assert.match(html, /data-opponent-lineup-label>Opponent team<\/h2>/);
  assert.doesNotMatch(html, /data-lineup-next-step/);
  assert.doesNotMatch(html, />Next:<\/strong>/);
});

test('captain and opponent states are explicit words attached to the named teams', () => {
  const html = renderLineupPage();

  assert.match(html, /data-own-lineup-status data-state="missing">Not submitted<\/div>/);
  assert.match(html, /data-opponent-lineup-status data-state="missing">Not submitted<\/div>/);
  assert.match(html, /ownLineupStatus\.textContent='Submitted · editable'/);
  assert.match(html, /ownLineupStatus\.textContent='Locked'/);
  assert.match(html, /opponentLineupStatus\.textContent='Submitted'/);
  assert.match(html, /opponentLineupStatus\.textContent='Locked'/);
  assert.match(html, /ownLineupLabel\.textContent=ownName/);
  assert.match(html, /opponentLineupLabel\.textContent=opponentName/);
  assert.match(html, /ownLineupStatus\.setAttribute\('aria-label',ownName\+' lineup: '/);
  assert.match(html, /opponentLineupStatus\.setAttribute\('aria-label',opponentName\+' lineup: '/);
});

test('the captain side owns the obvious action instead of a detached instruction', () => {
  const html = renderLineupPage();

  assert.match(html, /data-matchup-primary data-action="submit"[^>]*>Choose 3 &amp; submit<\/button>/);
  assert.match(html, /data-matchup-secondary[^>]*hidden>Withdraw submission<\/button>/);
  assert.match(html, /matchupPrimary\.textContent='Edit submitted lineup'/);
  assert.match(html, /matchupPrimary\.textContent='Score matches'/);
  assert.match(html, /matchupSecondary\.textContent='Withdraw '\+ownName\+' submission'/);
  assert.match(html, /if\(action==='submit'&&slotCountReady\(\)\)\{document\.querySelector\('\[data-submit\]'\)\?\.click\(\)/);
  assert.match(html, /if\(action==='score'\)\{location\.href='\/scorecard'/);
  assert.match(html, /matchupSecondary\.addEventListener\('click',\(\)=>document\.querySelector\('\[data-unlock\]'\)\?\.click\(\)\)/);
});

test('plain language explains what each side means without icon or badge decoding', () => {
  const html = renderLineupPage();

  assert.match(html, /Choose 3 players\. '\+ownName\+' stays editable until '\+opponentName\+' submits\./);
  assert.match(html, /ownName\+' is submitted\. You can still change these 3 players until '\+opponentName\+' submits\.'/);
  assert.match(html, /opponentName\+' already submitted\. Submit '\+ownName\+' to lock and reveal both lineups\.'/);
  assert.match(html, /Their players stay hidden until '\+ownName\+' submits\.'/);
  assert.match(html, /Both lineups are revealed\. Scoring is ready\./);
  assert.match(html, /Waiting for '\+opponentName\+'\\'s captain\.'/);
});

test('one-team captains lose the redundant team picker and phone layout stacks the matchup', () => {
  const html = renderLineupPage();

  assert.match(html, /teamField\.hidden=captainTeams\.length===1/);
  assert.match(html, /@media\(max-width:800px\)\{[^}]*\.matchup-stage\{grid-template-columns:1fr/s);
  assert.match(html, /\.matchup-side-own\{[^}]*border-top:6px solid var\(--green\)/);
  assert.match(html, /\.matchup-side-opponent\{[^}]*border-top:6px solid var\(--gold\)/);
  assert.match(html, /\.side-name\{[^}]*overflow-wrap:anywhere/);
  assert.match(html, /\.lineup-panel \.submission-state,\.mobile-lineup-summary \.submission-state\{display:none\}/);
  assert.match(html, /\.mobile-lineup-summary\{[^}]*background:rgba\(255,255,255,\.98\)!important/);
});
