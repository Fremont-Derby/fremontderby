import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

test('admin players page is scan-first with manage disclosure', () => {
  const html = renderAdminPlayersPage();
  assert.match(html, /<details class="manage"|className='manage'|class="manage"/);
  assert.match(html, /Manage player/);
  assert.match(html, /manage-body/);
  assert.match(html, /rosterControl\(player,manageBody\)/);
  assert.match(html, /eligibilityControl\(player,manageBody\)/);
  assert.match(html, /roleControl\(player,manageBody\)/);
});
