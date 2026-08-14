import assert from 'node:assert/strict';
import test from 'node:test';
import { renderScorecardPage } from '../src/scorecardPage.js';
import { renderPlayerSandboxPage } from '../src/playerSandboxPage.js';
import { renderCaptainSandboxPage } from '../src/captainSandboxPage.js';

test('live scorecard is phone-first with large winner and edit targets', () => {
  const html = renderScorecardPage();
  assert.match(html, /name="viewport"/);
  assert.match(html, /Fremont Derby Scorecard/);
  assert.match(html, /min-height:48px/);
  assert.match(html, /touch-action:manipulation/);
  assert.match(html, /winner\{min-height:56px/);
  assert.match(html, /add-rack\{[^}]*min-height:62px/);
  assert.match(html, /ledger-scroll\{[^}]*touch-action:\s*pan-x/);
});

test('player sandbox scorecard reuses the same mobile scorecard shell', () => {
  const html = renderPlayerSandboxPage();
  assert.match(html, /name="viewport"/);
  assert.match(html, /min-height:48px/);
  assert.match(html, /touch-action:manipulation/);
});

test('captain sandbox keeps viewport and touch-sized controls', () => {
  const html = renderCaptainSandboxPage();
  assert.match(html, /name="viewport"/);
  assert.match(html, /min-height:\s*44px|min-height:44px|min-height:48px/);
});
