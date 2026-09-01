import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup page labels own and opponent submission states independently', () => {
  const html = renderLineupPage();

  assert.match(html, /aria-label="Lineup submission status"/);
  assert.match(html, /<strong>Your lineup<\/strong><span class="lineup-state-value" data-own-lineup-status/);
  assert.match(html, /<strong>Opponent lineup<\/strong><span class="lineup-state-value" data-opponent-lineup-status/);
  assert.match(html, /ownLineupStatus\.textContent=lineupLocked\?'Locked':ownSubmitted\?'Submitted · editable':'Not submitted'/);
  assert.match(html, /opponentLineupStatus\.textContent=lineupLocked\?'Locked':opponentSubmitted\?'Submitted':'Not submitted'/);
  assert.match(html, /round\.lineupState=ownSubmitted\?'set':'missing'/);
});

test('lineup status summary remains readable on mobile', () => {
  const html = renderLineupPage();

  assert.match(html, /\.lineup-state-summary\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(html, /@media\(max-width:800px\).*\.lineup-state-summary\{grid-template-columns:1fr;gap:8px\}/s);
  assert.match(html, /data-state="locked"/);
  assert.match(html, /data-state="editable"/);
});
