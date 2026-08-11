import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('availability page uses signed-in human-readable league-night selection', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /Fremont Derby Availability/);
  assert.match(html, /data-context-select/);
  assert.doesNotMatch(html, /data-season-id/);
  assert.doesNotMatch(html, /data-round-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Round ID</i);
  assert.doesNotMatch(html, />Access token</i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /data-availability-status="available"/);
  assert.match(html, /data-availability-status="unsure"/);
  assert.match(html, /data-availability-status="unavailable"/);
  assert.match(html, /\/availability\/me/);
  assert.match(html, /\/free-agent-availability\/me/);
  assert.match(html, /No published regular-season rounds/);
});

test('availability choices stay compact and expose selected state accessibly', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /class="actions" role="group" aria-label="Availability status"/);
  assert.equal((html.match(/aria-pressed="false"/g) || []).length, 3);
  assert.match(html, /\.actions\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(html, /\.actions,.choice-actions\{grid-template-columns:1fr\}/);
  assert.match(html, /button:focus-visible,select:focus-visible,.signin:focus-visible/);
  assert.match(html, /button\[aria-pressed="true"\]::after\{content:' ✓'/);
  assert.match(html, /function setAvailabilityState\(value\)/);
  assert.match(html, /button\.setAttribute\('aria-pressed',String\(button\.dataset\.availabilityStatus===value\)\)/);
  assert.match(html, /renderContext\(\)\{const context=selectedContext\(\);setAvailabilityState\(null\)/);
  assert.match(html, /await signedApi\(path,[\s\S]*setAvailabilityState\(value\);setStatus\('Availability saved'/);
});

test('dual-team player chooses one matchup team before captains build lineups', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /Choose your team/);
  assert.match(html, /Required before lineups/);
  assert.match(html, /\/api\/me\/team-match-choices/);
  assert.match(html, /\/team-choice\/me/);
  assert.match(html, /You belong to both teams/);
  assert.match(html, /data-choose-team/);
  assert.match(html, /Choice locked because a lineup already includes you/);
});