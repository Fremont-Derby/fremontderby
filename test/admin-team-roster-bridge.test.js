import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';

test('season teams gives prepared/current teams an explicit phone-safe Add players action', () => {
  const html = renderAdminSeasonTeamsPage();

  assert.match(html, /rosterLink\.textContent='Add players'/);
  assert.match(html, /\/admin\/players\?season=/);
  assert.match(html, /'&team='/);
  assert.match(html, /function isTargetSeasonTeam\(row\)/);
  assert.match(html, /if\(isTargetSeasonTeam\(row\)\)[\s\S]*actions\.append\(rosterLink\)/);
  assert.match(html, /\.roster-link\{display:flex;align-items:center;justify-content:center/);
  assert.match(html, /@media\(max-width:520px\)[\s\S]*\.roster-link[\s\S]*width:100%/);
  assert.doesNotMatch(html, /Enter team ID/i);
});
