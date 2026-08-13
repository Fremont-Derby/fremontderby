import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

test('admin players page is scan-first with manage disclosure and phone-sized controls', () => {
  const html = renderAdminPlayersPage();
  assert.match(html, /Manage player/);
  assert.match(html, /manage-body/);
  assert.match(html, /rosterControl\(player,manageBody\)/);
  assert.match(html, /eligibilityControl\(player,manageBody\)/);
  assert.match(html, /roleControl\(player,manageBody\)/);
  assert.match(html, /data-letter-index/);
  assert.match(html, /function filteredPlayers\(\)/);
  assert.match(html, /team-remove\{min-height:44px/);
  assert.match(html, /manage>summary\{min-height:44px/);
  assert.match(html, /manage>summary:focus-visible/);
});
