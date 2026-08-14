import assert from 'node:assert/strict';
import test from 'node:test';
import { livePageRefreshScript } from '../src/livePageRefresh.js';
import { decorateHtmlWithShell } from '../src/appShell.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('live refresh script registers poll and visibility hooks', () => {
  assert.match(livePageRefreshScript, /fdLiveRefresh/);
  assert.match(livePageRefreshScript, /visibilitychange/);
  assert.match(livePageRefreshScript, /setInterval/);
  assert.match(livePageRefreshScript, /pageshow/);
});

test('app shell injects live refresh on pages', () => {
  const html = decorateHtmlWithShell('<!doctype html><html><head></head><body><main>x</main></body></html>', '/schedule');
  assert.match(html, /data-fd-live-refresh-script/);
  assert.match(html, /fdLiveRefresh/);
});

test('data pages register live refresh', () => {
  for (const [name, html] of [
    ['schedule', renderSchedulePage()],
    ['teams', renderTeamsPage()],
    ['availability', renderAvailabilityPage()],
    ['scorePicker', renderScorePickerPage()],
  ]) {
    assert.match(html, /fdLiveRefresh\.register/, name);
  }
});
