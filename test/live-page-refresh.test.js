import assert from 'node:assert/strict';
import test from 'node:test';
import { livePageRefreshScript } from '../src/livePageRefresh.js';
import { decorateHtmlWithShell } from '../src/appShell.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderAvailabilityPage } from '../src/availabilityPage.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('live refresh script is resilient and battery-aware', () => {
  assert.match(livePageRefreshScript, /fdLiveRefresh/);
  assert.match(livePageRefreshScript, /visibilitychange/);
  assert.match(livePageRefreshScript, /setInterval/);
  assert.match(livePageRefreshScript, /pageshow/);
  assert.match(livePageRefreshScript, /online/);
  assert.match(livePageRefreshScript, /DEBOUNCE_MS/);
  assert.match(livePageRefreshScript, /failCount/);
  assert.match(livePageRefreshScript, /quiet = reason !== 'manual'/);
  assert.match(livePageRefreshScript, /fdConditionalFetch/);
  assert.match(livePageRefreshScript, /if-none-match/);
});

test('app shell injects live refresh on pages', () => {
  const html = decorateHtmlWithShell(
    '<!doctype html><html><head></head><body><main>x</main></body></html>',
    '/schedule',
  );
  assert.match(html, /data-fd-live-refresh-script/);
  assert.match(html, /fdLiveRefresh/);
});

test('data pages register live refresh with quiet-capable loaders', () => {
  assert.match(renderSchedulePage(), /fdLiveRefresh\.register\(\(opts\)/);
  assert.match(renderTeamsPage(), /fdLiveRefresh\.register/);
  assert.match(renderAvailabilityPage(), /fdLiveRefresh\.register\(\(opts\)/);
  assert.match(renderScorePickerPage(), /fdLiveRefresh\.register\(\(opts\)/);
  assert.match(renderSchedulePage(), /loadSchedule\(opts\)/);
});
