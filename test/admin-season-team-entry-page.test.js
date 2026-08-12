import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';

test('season team admin page distinguishes returning reservation from qualified new-team entry', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /Reserve returning teams and add qualified new teams/);
  assert.match(html, /activeTab==='returning'\?'Reserve slot':'Add to season'/);
  assert.match(html, /button\.disabled=!Boolean\(normalized\(row,'canTakeSlot'\)\)/);
  assert.match(html, /entryReason/);
  assert.match(html, /Assign a captain and add at least 3 players to qualify for a season slot/);
});
