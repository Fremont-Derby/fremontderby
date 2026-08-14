import assert from 'node:assert/strict';
import test from 'node:test';
import { renderScorecardPage } from '../src/scorecardPage.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderProfilePage } from '../src/profilePage.js';
import { renderChatPage } from '../src/chatPage.js';

test('form fields use 16px text to avoid iOS focus zoom on key surfaces', () => {
  for (const html of [
    renderAdminPlayersPage(),
    renderStandingsPage(),
    renderSchedulePage(),
    renderProfilePage(),
    renderScorecardPage(),
  ]) {
    assert.match(html, /input,select,textarea\{font-size:16px\}|input,\s*select,\s*textarea\s*\{\s*font-size:\s*16px/);
  }
});

test('scorecard respects home-indicator safe area on phones', () => {
  const html = renderScorecardPage();
  assert.match(html, /safe-area-inset-bottom/);
  assert.match(html, /error-popup\{[^}]*safe-area-inset-bottom/);
});

test('chat controls use manipulation touch-action and 16px inputs', () => {
  const html = renderChatPage();
  assert.match(html, /touch-action:\s*manipulation/);
  assert.match(html, /font-size:\s*16px/);
});
