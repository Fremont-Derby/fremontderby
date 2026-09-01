import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup page names both teams and separates own lock state from opponent submission state', () => {
  const html = renderLineupPage();

  assert.match(html, /aria-label="Lineup submission status"/);
  assert.match(html, /data-own-lineup-label>Your team<\/strong>/);
  assert.match(html, /data-opponent-lineup-label>Opponent team<\/strong>/);
  assert.match(html, /data-own-lineup-status data-state="unlocked">Unlocked<\/span>/);
  assert.match(html, /data-opponent-lineup-status data-state="missing">Not submitted<\/span>/);
  assert.match(html, /const ownName=team\?\.teamName\|\|'Your team'/);
  assert.match(html, /const opponentName=round\?\.opponentName\|\|'Opponent team'/);
  assert.match(html, /ownLineupLabel\.textContent=ownName/);
  assert.match(html, /opponentLineupLabel\.textContent=opponentName/);
  assert.match(html, /ownLineupStatus\.textContent=lineupLocked\?'Locked':'Unlocked'/);
  assert.match(html, /opponentLineupStatus\.textContent=opponentSubmitted\?'Submitted':'Not submitted'/);
  assert.match(html, /ownName\+' lineup lock state: '/);
  assert.match(html, /opponentName\+' lineup submission state: '/);
  assert.match(html, /round\.lineupState=ownSubmitted\?'set':'missing'/);
});

test('lineup page gives one concrete next action for every submission combination', () => {
  const html = renderLineupPage();

  assert.match(html, /data-lineup-next-step/);
  assert.match(html, /Waiting on '\+opponentName/);
  assert.match(html, /is still unlocked, so you can edit and resubmit until they submit/);
  assert.match(html, /has submitted\. Pick three for '\+ownName/);
  assert.match(html, /Both lineups are locked and revealed\. Continue to scoring/);
  assert.match(html, /stays unlocked until '\+opponentName\+' also submits/);
});

test('lineup content uses the light product surface and removes duplicate status blocks', () => {
  const html = renderLineupPage();

  assert.match(html, /:root\{color-scheme:light/);
  assert.match(html, /\.matchup-card\{[^}]*background:#fff/);
  assert.match(html, /\.lineup-state-row\{[^}]*background:var\(--soft\)/);
  assert.match(html, /\.lineup-panel \.submission-state,\.mobile-lineup-summary \.submission-state\{display:none\}/);
  assert.match(html, /\.mobile-lineup-summary\{[^}]*background:rgba\(255,255,255,\.98\)!important/);
  assert.match(html, /\.status\[data-tone="error"\]\{/);
});

test('lineup matchup status keeps long team identities readable on narrow phones', () => {
  const html = renderLineupPage();

  assert.match(html, /\.lineup-state-row strong\{[^}]*overflow-wrap:anywhere/);
  assert.match(html, /@media\(max-width:800px\).*\.lineup-state-summary\{grid-template-columns:1fr;gap:8px\}/s);
  assert.match(html, /@media\(max-width:380px\)\{\.lineup-state-row\{grid-template-columns:1fr\}/);
  assert.match(html, /data-state="locked"/);
  assert.match(html, /data-state="unlocked"/);
});
