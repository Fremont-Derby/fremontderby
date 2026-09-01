import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup page labels each submission state with the concrete matchup team', () => {
  const html = renderLineupPage();

  assert.match(html, /aria-label="Lineup submission status"/);
  assert.match(html, /data-own-lineup-label>Your team<\/strong>/);
  assert.match(html, /data-opponent-lineup-label>Opponent team<\/strong>/);
  assert.match(html, /function activeRound\(\)/);
  assert.match(html, /const ownName=team\?\.teamName\|\|'Your team'/);
  assert.match(html, /const opponentName=round\?\.opponentName\|\|'Opponent team'/);
  assert.match(html, /ownLineupLabel\.textContent=ownName\+' \(your team\)'/);
  assert.match(html, /opponentLineupLabel\.textContent=opponentName\+' \(opponent\)'/);
  assert.match(html, /ownLineupStatus\.setAttribute\('aria-label',ownName\+' lineup status: '/);
  assert.match(html, /opponentLineupStatus\.setAttribute\('aria-label',opponentName\+' lineup status: '/);
  assert.match(html, /ownLineupStatus\.textContent=lineupLocked\?'Locked':ownSubmitted\?'Submitted · editable':'Not submitted'/);
  assert.match(html, /opponentLineupStatus\.textContent=lineupLocked\?'Locked':opponentSubmitted\?'Submitted':'Not submitted'/);
  assert.match(html, /round\.lineupState=ownSubmitted\?'set':'missing'/);
});

test('lineup status summary keeps long team identities readable on mobile', () => {
  const html = renderLineupPage();

  assert.match(html, /\.lineup-state-summary\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(html, /\.lineup-state-row\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(html, /\.lineup-state-row strong\{min-width:0;font-size:\.86rem;overflow-wrap:anywhere\}/);
  assert.match(html, /@media\(max-width:800px\).*\.lineup-state-summary\{grid-template-columns:1fr;gap:8px\}\.lineup-state-row\{grid-template-columns:1fr\}/s);
  assert.match(html, /\.lineup-state-value\{width:max-content;max-width:100%;white-space:normal\}/);
  assert.match(html, /data-state="locked"/);
  assert.match(html, /data-state="editable"/);
});
