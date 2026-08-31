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
  assert.match(html, /Each week has fixed green, yellow, and red choices/);
  assert.match(html, /Needs response/);
  assert.match(html, /aria-pressed/);
  assert.match(html, /quick-actions button\[data-value="available"\][\s\S]*background: #70c95a/);
  assert.match(html, /quick-actions button\[data-value="unsure"\][\s\S]*background: #f5c93c/);
  assert.match(html, /quick-actions button\[data-value="unavailable"\][\s\S]*background: #ef4a45/);
});

test('check-in presentation is readable pastel with no neon blur or glow treatment', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /data-checkin-readable-theme/);
  assert.match(html, /body \{[\s\S]*background: #f7f7f4 !important/);
  assert.match(html, /\.intro h1 \{[\s\S]*color: #0a4f31 !important/);
  assert.match(html, /\.intro p \{[\s\S]*color: #171b18 !important/);
  assert.match(html, /\.date-card\[data-state="available"\][\s\S]*background: #b9e5ad !important/);
  assert.match(html, /\.date-card\[data-state="unsure"\][\s\S]*background: #ffe7a0 !important/);
  assert.match(html, /\.date-card\[data-state="unavailable"\][\s\S]*background: #f6ada6 !important/);
  assert.match(html, /button\[aria-pressed="true"\][\s\S]*box-shadow: 0 0 0 4px #111713/);
  assert.doesNotMatch(html, /data-checkin-trippy-theme/);
  assert.doesNotMatch(html, /drop-shadow/);
  assert.doesNotMatch(html, /backdrop-filter: blur\(3px\)/);
});

test('saved responses load for every grouped upcoming date and saves update only the tapped row', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /Promise\.all\(groups\.map/);
  assert.match(html, /loadSavedAvailability\(group,card\)/);
  assert.match(html, /saveAvailability\(group,card,item\.value\)/);
  assert.match(html, /availability\/me\?date=/);
});
