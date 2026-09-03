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
  assert.match(html, /No upcoming published regular-season rounds/);
});

test('check-in hides past weeks before rendering or loading saved state', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /function localDateKey\(date=new Date\(\)\)/);
  assert.match(html, /const today=localDateKey\(\)/);
  assert.match(html, /if\(context\.scheduledOn&&context\.scheduledOn<today\)continue/);
  assert.match(html, /const groups=groupContexts\(contexts\)/);
  assert.match(html, /Promise\.all\(groups\.map/);
});

test('one-tap check-in restores saved date availability with fixed color bands', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /data-response/);
  assert.match(html, /Needs response/);
  assert.match(html, /\/api\/seasons\/.*\/availability\/me\?date=/);
  assert.match(html, /method:'PUT'/);
  assert.match(html, /availability_status/);
  assert.match(html, /setRowState\(card,availability\.availability_status\|\|null\)/);
  assert.match(html, /setRowState\(card,body\.availability\?\.availability_status\|\|value\)/);
  assert.match(html, /card\.dataset\.state=state/);
  assert.match(html, /\.date-card\[data-state="available"\]\{background:linear-gradient/);
  assert.match(html, /\.date-card\[data-state="unsure"\]\{background:linear-gradient/);
  assert.match(html, /\.date-card\[data-state="unavailable"\]\{background:linear-gradient/);
  assert.match(html, /\.date-card\[data-state="unmarked"\]\{background:repeating-linear-gradient/);
  assert.match(html, /height:72px;min-height:72px;max-height:72px/);
  assert.match(html, /\.quick-actions button\[data-value="available"\]\{background:linear-gradient/);
  assert.match(html, /\.quick-actions button\[data-value="unsure"\]\{background:linear-gradient/);
  assert.match(html, /\.quick-actions button\[data-value="unavailable"\]\{background:linear-gradient/);
  assert.match(html, /label:'Maybe'/);
  assert.match(html, /\.row-status\{position:absolute;width:1px;height:1px/);
  assert.doesNotMatch(html, /transition:/);
});

test('unanswered upcoming weeks are explicitly called out', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /'Needs response'/);
  assert.match(html, /function updateNeedsResponseStatus\(\)/);
  assert.match(html, /querySelectorAll\('\.date-card\[data-state="unmarked"\]'\)/);
  assert.match(html, /upcoming week/);
  assert.match(html, /All upcoming weeks are checked in/);
  assert.match(html, /updateNeedsResponseStatus\(\)/);
});

test('availability uses compact accessible one-tap controls per date', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /data-date-list[^>]*role="table"/);
  assert.match(html, /card\.setAttribute\('role','row'\)/);
  assert.match(html, /actions\.setAttribute\('role','group'\)/);
  assert.match(html, /actions\.setAttribute\('aria-label','Availability for '/);
  assert.match(html, /button\.setAttribute\('aria-label',item\.ariaLabel\+' for '/);
  assert.match(html, /button\.setAttribute\('aria-pressed','false'\)/);
  assert.match(html, /\.date-card\{position:relative;display:grid;grid-template-columns:/);
  assert.match(html, /\.quick-actions button\{height:48px;min-height:48px/);
  assert.match(html, /@media\(max-width:560px\).*\.quick-actions button\{height:44px;min-height:44px/);
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

test('JFL check-in theme uses readable light surfaces without blur or glow', () => {
  const html = renderAvailabilityPage();

  assert.match(html, /data-checkin-readable-theme/);
  assert.match(html, /body \{[\s\S]*background: #f7f7f4 !important/);
  assert.match(html, /\.intro h1 \{[\s\S]*color: #0a4f31 !important/);
  assert.match(html, /\.intro p \{[\s\S]*color: #171b18 !important/);
  assert.match(html, /\.date-card\[data-state="available"\][\s\S]*background: #b9e5ad !important/);
  assert.match(html, /\.date-card\[data-state="unsure"\][\s\S]*background: #ffe7a0 !important/);
  assert.match(html, /\.date-card\[data-state="unavailable"\][\s\S]*background: #f6ada6 !important/);
  assert.match(html, /\.quick-actions button\[aria-pressed="true"\][\s\S]*box-shadow: 0 0 0 4px #111713 !important/);
  assert.doesNotMatch(html, /data-checkin-trippy-theme/);
  assert.doesNotMatch(html, /drop-shadow/);
  assert.doesNotMatch(html, /backdrop-filter: blur\(3px\)/);
});
