import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('availability page uses signed-in human-readable league-night selection', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /Check in/);
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
  assert.match(html, /No published regular-season rounds/);
});

test('one-tap check-in restores saved date availability and makes current state obvious', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /data-current-status/);
  assert.match(html, /Your answer/);
  assert.match(html, /\/api\/seasons\/.*\/availability\/me\?date=/);
  assert.match(html, /method:'PUT'/);
  assert.match(html, /availability_status/);
  assert.match(html, /await loadSavedAvailability\(context\)/);
  assert.match(html, /setAvailabilityState\(availability\.availability_status\|\|'unsure'\)/);
  assert.match(html, /setAvailabilityState\(body\.availability\?\.availability_status\|\|value\)/);
  assert.doesNotMatch(html, /renderContext\(\)\{const context=selectedContext\(\);setAvailabilityState\(null\)/);
});

test('availability choices are large accessible one-tap controls', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /class="actions" role="group" aria-label="Your availability"/);
  assert.equal((html.match(/aria-pressed="false"/g) || []).length, 3);
  assert.match(html, /\.actions button\{min-height:64px/);
  assert.match(html, /button\[aria-pressed="true"\]/);
  assert.match(html, /button:focus-visible,select:focus-visible,.signin:focus-visible,.retry:focus-visible/);
  assert.match(html, /function setAvailabilityState\(value\)/);
  assert.match(html, /button\.setAttribute\('aria-pressed',String\(button\.dataset\.availabilityStatus===value\)\)/);
});

test('match date and team context appear before the check-in action', () => {
  const html = renderAvailabilityPage();

  const contextIndex = html.indexOf('data-context-title');
  const actionsIndex = html.indexOf('class="actions"');
  assert.ok(contextIndex > -1 && actionsIndex > contextIndex);
  assert.match(html, /data-context-detail/);
  assert.match(html, /Team: /);
  assert.match(html, /available to substitute/);
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

test('availability first render and recovery states are task-oriented', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /data-recovery aria-live="polite"/);
  assert.match(html, /data-workspace hidden/);
  assert.match(html, /Loading your league nights…/);
  assert.match(html, /Sign in to check in/);
  assert.match(html, /Open Profile and sign in again/);
  assert.match(html, /Check-in could not be loaded/);
  assert.match(html, /Try again/);
  assert.match(html, /function showWorkspace\(\)\{recovery\.hidden=true;workspace\.hidden=false\}/);
});
