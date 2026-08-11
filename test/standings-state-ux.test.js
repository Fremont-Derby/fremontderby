import assert from 'node:assert/strict';
import test from 'node:test';

import { renderStandingsPage } from '../src/standingsPage.js';

test('standings starts in an honest loading state with accessible status', () => {
  const html = renderStandingsPage();

  assert.match(html, /data-status aria-live="polite">Loading seasons…<\/div>/);
  assert.doesNotMatch(html, /data-status[^>]*>Ready<\/div>/);
  assert.match(html, /data-page-state hidden aria-live="polite"/);
});

test('standings provides useful no-season and load-failure recovery', () => {
  const html = renderStandingsPage();

  assert.match(html, /No season yet/);
  assert.match(html, /View league rules/);
  assert.match(html, /Standings unavailable/);
  assert.match(html, /Nothing needs to be re-entered/);
  assert.match(html, />Try again<\/a>/);
  assert.match(html, /loadButton\.disabled=seasons\.length===0/);
});

test('standings recovery actions remain keyboard and mobile friendly', () => {
  const html = renderStandingsPage();

  assert.match(html, /\.state-action:focus-visible\{outline:3px solid var\(--focus\)/);
  assert.match(html, /\.state-action\{width:max-content;min-height:44px/);
  assert.match(html, /\.register-link,\.state-action\{width:100%/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
});
