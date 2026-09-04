import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';

test('season teams gives prepared/current teams an explicit phone-safe Add players action', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /Add players/);
  assert.match(html, /roster-link/);
  assert.doesNotMatch(html, /Enter team ID/i);
});
