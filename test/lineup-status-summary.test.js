import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup page names both teams and keeps own lock state distinct from opponent submission state', () => {
  const html = renderLineupPage();

  assert.match(html, /aria-label="Lineup status"/);
  assert.match(html, /data-own-lineup-label>Your team<\/strong>/);
  assert.match(html, /data-opponent-lineup-label>Opponent team<\/strong>/);
  assert.match(html, /data-own-lineup-status data-state="unlocked">Unlocked<\/span>/);
  assert.match(html, /data-opponent-lineup-status data-state="missing">Not submitted<\/span>/);
  assert.match(html, /matchupTitle\.textContent=round\?ownName\+' vs '\+opponentName/);
  assert.match(html, /ownLineupStatus\.textContent=lineupLocked\?'Locked':'Unlocked'/);
  assert.match(html, /opponentLineupStatus\.textContent=opponentSubmitted\?'Submitted':'Not submitted'/);
});

test('lineup status explains each team in plain language instead of forcing badge decoding', () => {
  const html = renderLineupPage();

  assert.match(html, /Your lineup is submitted\. You can still change it\./);
  assert.match(html, /Waiting for their lineup\./);
  assert.match(html, /Their lineup is submitted\. Their players stay hidden until you submit\./);
  assert.match(html, /Both teams submitted\. Your lineup is locked and revealed\./);
  assert.match(html, /data-lineup-next-step/);
  assert.match(html, /Edit if you want\. When '\+opponentName\+' submits, both lineups lock and reveal\./);
  assert.match(html, /Pick three players and submit '\+ownName/);
  assert.match(html, /Go to scoring\./);
});

test('lineup page reduces mobile selector clutter when captain has one team', () => {
  const html = renderLineupPage();

  assert.match(html, /data-team-field/);
  assert.match(html, /teamField\.hidden=captainTeams\.length===1/);
  assert.match(html, /Choose the week you are setting a lineup for\./);
});

test('lineup content stays light, removes duplicate opponent status, and wraps narrow phones', () => {
  const html = renderLineupPage();

  assert.match(html, /:root\{color-scheme:light/);
  assert.match(html, /\.matchup-card\{[^}]*background:#fff/);
  assert.match(html, /\.lineup-panel \.submission-state,\.mobile-lineup-summary \.submission-state\{display:none\}/);
  assert.match(html, /\.mobile-lineup-summary\{[^}]*background:rgba\(255,255,255,\.98\)!important/);
  assert.match(html, /\.team-status-heading strong\{[^}]*overflow-wrap:anywhere/);
  assert.match(html, /@media\(max-width:360px\)\{\.team-status-heading\{display:grid/);
  assert.match(html, /\.status\[data-tone="error"\]\{/);
});
