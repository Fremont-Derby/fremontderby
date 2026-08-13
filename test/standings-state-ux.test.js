import assert from 'node:assert/strict';
import test from 'node:test';

import { renderStandingsPage } from '../src/standingsPage.js';

test('standings starts in an honest loading state with accessible status', () => {
  const html = renderStandingsPage();

  assert.match(html, /data-status aria-live="polite">Loading seasons…<\/div>/);
  assert.doesNotMatch(html, /data-status[^>]*>Ready<\/div>/);
  assert.match(html, /data-page-state hidden aria-live="polite"/);
  assert.match(html, /<select name="seasonId" data-season-id disabled><option value="">Loading seasons…<\/option><\/select>/);
  assert.match(html, /<button class="load" data-load type="submit" disabled>Load standings<\/button>/);
  assert.match(html, /loadSeasons\(\)\{setStatus\('Loading seasons\.\.\.'\);hideState\(\);seasonInput\.disabled=true;loadButton\.disabled=true;/);
});

test('standings provides useful no-season and load-failure recovery', () => {
  const html = renderStandingsPage();

  assert.match(html, /No season yet/);
  assert.match(html, /View league rules/);
  assert.match(html, /Standings unavailable/);
  assert.match(html, /Nothing needs to be re-entered/);
  assert.match(html, /'Try again'/);
  assert.match(html, /loadButton\.disabled=seasons\.length===0/);
});

test('registration summary is shown only while the selected season is in registration', () => {
  const html = renderStandingsPage();

  assert.match(html, /const isRegistration=season\?\.status==='registration';registrationSummary\.hidden=!isRegistration;if\(!isRegistration\)return/);
  assert.match(html, /Register or join a team/);
  assert.doesNotMatch(html, /if\(!isRegistration\)\{registerLink\.textContent='View teams'/);
});

test('standings recovery actions remain keyboard and mobile friendly', () => {
  const html = renderStandingsPage();

  assert.match(html, /\.state-action:focus-visible/);
  assert.match(html, /outline:3px solid var\(--focus\)/);
  assert.match(html, /\.state-action\{width:max-content;min-height:44px/);
  assert.match(html, /\.register-link,\.state-action\{width:100%/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
});
