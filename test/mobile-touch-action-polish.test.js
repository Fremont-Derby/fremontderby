import assert from 'node:assert/strict';
import test from 'node:test';
import { shellStyles, renderMobileDock } from '../src/appShell.js';
import { renderScorecardPage } from '../src/scorecardPage.js';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderAdminGatewayPage } from '../src/adminGatewayPage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderPrizesPage } from '../src/prizesPage.js';
import { renderTradesPage } from '../src/tradesPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderProfilePage } from '../src/profilePage.js';

test('app shell dock and nav declare manipulation touch-action', () => {
  assert.match(shellStyles, /fd-mobile-dock a[\s\S]*touch-action:\s*manipulation/);
  assert.match(shellStyles, /fd-nav a[\s\S]*touch-action:\s*manipulation/);
  assert.match(shellStyles, /-webkit-tap-highlight-color:\s*transparent/);
  const dock = renderMobileDock('/teams');
  assert.match(dock, /fd-mobile-dock/);
  assert.match(dock, /Score/);
});

test('scorecard keeps manipulation on controls and pan-x on ledger', () => {
  const html = renderScorecardPage();
  assert.match(html, /touch-action:manipulation/);
  assert.match(html, /ledger-scroll\{[^}]*touch-action:\s*pan-x/);
  assert.match(html, /perspective button\{min-height:44px\}/);
  assert.match(html, /-webkit-tap-highlight-color:transparent/);
});

test('admin and league pages apply manipulation to interactive controls', () => {
  for (const html of [
    renderAdminPlayersPage(),
    renderAdminGatewayPage(),
    renderStandingsPage(),
    renderPrizesPage(),
    renderTradesPage(),
    renderSchedulePage(),
    renderTeamsPage(),
    renderProfilePage(),
  ]) {
    assert.match(html, /touch-action:\s*manipulation/);
  }
});
