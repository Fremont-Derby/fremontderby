import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('availability page uses signed-in human-readable league-night list', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /Check in/);
  assert.match(html, /data-date-list/);
  assert.doesNotMatch(html, /data-context-select/);
  assert.doesNotMatch(html, /data-season-id/);
  assert.doesNotMatch(html, /data-round-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Round ID</i);
  assert.doesNotMatch(html, />Access token</i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /\/api\/me\/teams/);
  assert.match(html, /button\.dataset\.value=item\.value/);
  assert.match(html, /value:'available'/);
  assert.match(html, /value:'unsure'/);
  assert.match(html, /value:'unavailable'/);
  assert.match(html, /No published regular-season rounds/);
});

test('one-tap check-in restores saved date availability and makes every row state obvious', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /data-response/);
  assert.match(html, /Not marked/);
  assert.match(html, /\/api\/seasons\/.*\/availability\/me\?date=/);
  assert.match(html, /method:'PUT'/);
  assert.match(html, /availability_status/);
  assert.match(html, /Promise\.all\(groups\.map/);
  assert.match(html, /setRowState\(card,availability\.availability_status\|\|null\)/);
  assert.match(html, /setRowState\(card,body\.availability\?\.availability_status\|\|value\)/);
  assert.match(html, /card\.dataset\.state=state/);
  assert.match(html, /\.date-card\[data-state="available"\]\{background:var\(--green-bg\)\}/);
  assert.match(html, /\.date-card\[data-state="unsure"\]\{background:var\(--yellow-bg\)\}/);
  assert.match(html, /\.date-card\[data-state="unavailable"\]\{background:var\(--red-bg\)\}/);
  assert.match(html, /\.date-card\[data-state="unmarked"\]\{background:var\(--neutral-bg\)\}/);
  assert.match(html, /\.quick-actions button\{[^}]*background:transparent/);
  assert.match(html, /\.quick-actions button\[aria-pressed="true"\]\{[^}]*background:transparent/);
  assert.doesNotMatch(html, /\.quick-actions button\{[^}]*background:rgba\(255,255,255/);
});

test('availability uses compact accessible one-tap controls per date', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /data-date-list[^>]*role="table"/);
  assert.match(html, /card\.setAttribute\('role','row'\)/);
  assert.match(html, /actions\.setAttribute\('role','group'\)/);
  assert.match(html, /actions\.setAttribute\('aria-label','Availability for '/);
  assert.match(html, /button\.setAttribute\('aria-label',item\.ariaLabel\+' for '/);
  assert.match(html, /button\.setAttribute\('aria-pressed','false'\)/);
  assert.match(html, /\.date-card\{display:grid;grid-template-columns:/);
  assert.match(html, /\.quick-actions button\{min-height:36px/);
  assert.match(html, /@media\(max-width:560px\).*\.quick-actions button\{min-height:34px/);
  assert.match(html, /\.quick-actions button\[aria-pressed="true"\]/);
  assert.match(html, /button:focus-visible,.signin:focus-visible,.retry:focus-visible/);
  assert.match(html, /function setRowState\(card,value\)/);
  assert.match(html, /button\.setAttribute\('aria-pressed',String\(button\.dataset\.value===value\)\)/);
});

test('match date and team context appear before each check-in action', () => {
  const html = renderAvailabilityPage();

  const contextIndex = html.indexOf("copy.append(title,detail)");
  const actionsIndex = html.indexOf("actions.setAttribute('role','group')");
  assert.ok(contextIndex > -1 && actionsIndex > contextIndex);
  assert.match(html, /contextSummary\(group\)/);
  assert.match(html, /Round '\+context\.roundNumber/);
  assert.match(html, /context\.teamName\|\|'Your team'/);
  assert.match(html, /Free agent \/ substitute/);
  assert.match(html, /white-space:nowrap;overflow:hidden;text-overflow:ellipsis/);
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
