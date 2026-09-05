import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('availability page uses signed-in human-readable league-night selection', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /League night check-in/);
  assert.match(html, /data-context-select/);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Round ID</i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /data-availability-status="available"/);
  assert.match(html, /data-availability-status="unsure"/);
  assert.match(html, /data-availability-status="unavailable"/);
  assert.match(html, /No published league nights|No published rounds available/);
});

test('availability choices stay compact and expose selected state accessibly', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /role="group"/);
  assert.match(html, /data-availability-status/);
  assert.match(html, /function setAvailabilityState\(value\)/);
  assert.match(html, /Availability saved|saved/);
});

test('dual-team player chooses one matchup team before captains build lineups', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /Choose your team|team-match-choices|data-choose-team|You belong to both teams/);
});

test('availability first render and recovery states are task-oriented', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /data-recovery/);
  assert.match(html, /Sign in to mark availability|Finding your next league night/);
  assert.match(html, /Try again|Open Profile/);
});
