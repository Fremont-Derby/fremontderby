import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup page renders a signed-in human-readable three-player captain flow', () => {
  const html = renderLineupPage();

  assert.match(html, /Fremont Derby Lineup/);
  assert.match(html, /Pick your three/);
  assert.doesNotMatch(html, /Pick tonight's players/);
  assert.match(html, /data-team-select/);
  assert.match(html, /data-round-select/);
  assert.doesNotMatch(html, /data-team-id/);
  assert.doesNotMatch(html, /data-round-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.doesNotMatch(html, />Team ID</i);
  assert.doesNotMatch(html, />Round ID</i);
  assert.doesNotMatch(html, />Access token</i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /Matchup/);
  assert.match(html, /Round '/);
  assert.match(html, / · vs /);
  assert.match(html, /round\.opponentName/);
  assert.match(html, /Table '/);
  assert.match(html, /data-status-close/);
  assert.match(html, /role="status"/);
  assert.match(html, /data-availability-body/);
  assert.match(html, /data-slots/);
  assert.match(html, /data-submit/);
  assert.match(html, /Lock lineup/);
  assert.match(html, /Opponent order stays hidden until both teams submit/);
  assert.match(html, /index<3/);
  assert.doesNotMatch(html, /4 slots/);
  assert.match(html, /\/api\/teams\/:teamId\/rounds\/:roundId\/availability/);
  assert.match(html, /\/api\/teams\/:teamId\/rounds\/:roundId\/lineup/);
});

test('lineup page keeps the three selected slots and lock action visible on mobile', () => {
  const html = renderLineupPage();

  assert.match(html, /data-mobile-lineup-summary/);
  assert.match(html, /data-mobile-lineup-slots aria-live="polite"/);
  assert.match(html, /data-mobile-slot-count/);
  assert.match(html, /data-mobile-submit/);
  assert.match(html, /\.mobile-lineup-summary\{position:sticky;top:70px/);
  assert.match(html, /function renderMobileSummary\(\)/);
  assert.match(html, /label\.textContent='Slot '\+\(index\+1\)/);
  assert.match(html, /value\.textContent=slot\?\(slot\.forfeit\?'Forfeit':slot\.name\):'Empty'/);
  assert.match(html, /mobileSubmitButton\.disabled=lineupLocked\|\|filled!==3/);
  assert.match(html, /renderMobileSummary\(\)/);
  assert.match(html, /mobileSubmitButton\.addEventListener\('click',\(\)=>run\(submitLineup\)\)/);
});

test('lineup correction controls meet the phone touch and focus contract', () => {
  const html = renderLineupPage();

  assert.match(html, /\.slot-actions button\{min-width:44px;min-height:44px/);
  assert.match(html, /\.slot-actions button:focus-visible\{outline:3px solid #9ee5bd;outline-offset:2px\}/);
  assert.match(html, /\.slot\{grid-template-columns:42px minmax\(0,1fr\)\}/);
  assert.match(html, /\.slot-actions\{grid-column:2;justify-content:flex-start\}/);
  assert.doesNotMatch(html, /\.slot-actions button\{min-height:36px/);
});
