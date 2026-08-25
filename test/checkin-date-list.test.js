import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAvailabilityPage } from '../src/availabilityPage.js';

test('check-in exposes a visible upcoming date list instead of a league-night dropdown', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /data-date-list/);
  assert.doesNotMatch(html, /data-context-select/);
  assert.match(html, /groupContexts/);
  assert.match(html, /Upcoming league nights/);
  assert.match(html, /context\.scheduledOn&&context\.scheduledOn<today/);
});

test('each check-in date uses redundant green yellow red controls and saved response text', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /data-value='?"?available/);
  assert.match(html, /data-value='?"?unsure/);
  assert.match(html, /data-value='?"?unavailable/);
  assert.match(html, /Green = available, yellow = unsure, red = unavailable/);
  assert.match(html, /Needs response/);
  assert.match(html, /aria-pressed/);
  assert.match(html, /repeating-linear-gradient/);
});

test('saved responses load for every grouped upcoming date and saves update only the tapped row', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /Promise\.all\(groups\.map/);
  assert.match(html, /loadSavedAvailability\(group,card\)/);
  assert.match(html, /saveAvailability\(group,card,item\.value\)/);
  assert.match(html, /availability\/me\?date=/);
});
