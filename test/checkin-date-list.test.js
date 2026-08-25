import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('check-in exposes a visible date list instead of a league-night dropdown', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /data-date-list/);
  assert.doesNotMatch(html, /data-context-select/);
  assert.match(html, /groupContexts/);
  assert.match(html, /Upcoming league nights/);
});

test('each check-in date uses redundant green yellow red controls and saved response text', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /data-value='?"?available/);
  assert.match(html, /data-value='?"?unsure/);
  assert.match(html, /data-value='?"?unavailable/);
  assert.match(html, /Green means available, yellow means unsure, red means unavailable/);
  assert.match(html, /Not marked/);
  assert.match(html, /aria-pressed/);
});

test('saved responses load for every grouped date and saves update only the tapped row', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /Promise\.all\(groups\.map/);
  assert.match(html, /loadSavedAvailability\(group,card\)/);
  assert.match(html, /saveAvailability\(group,card,item\.value\)/);
  assert.match(html, /availability\/me\?date=/);
});
