import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conditionalJsonFromVersion,
  conditionalJsonResponse,
  weakEtag,
  versionTokenFromValue,
} from '../src/httpConditional.js';
import { livePageRefreshScript } from '../src/livePageRefresh.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import { renderStandingsPage } from '../src/standingsPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('recommendation: client conditional fetch is available to pages', () => {
  assert.match(livePageRefreshScript, /fdConditionalFetch/);
  assert.match(livePageRefreshScript, /if-none-match/);
  assert.match(livePageRefreshScript, /fdReadCachedJson/);
  assert.match(renderSchedulePage(), /fdConditionalFetch/);
  assert.match(renderStandingsPage(), /fdConditionalFetch/);
  assert.match(renderTeamsPage(), /fdConditionalFetch/);
  assert.match(renderScorePickerPage(), /fdConditionalFetch/);
});

test('recommendation: public responses may advertise short shared cache TTL', async () => {
  const body = { seasons: [{ id: '1' }] };
  const response = await conditionalJsonResponse(
    new Request('https://example.test/api/seasons'),
    body,
    { cacheControl: 'public, max-age=15, s-maxage=30, stale-while-revalidate=60' },
  );
  assert.match(response.headers.get('cache-control'), /public/);
  assert.match(response.headers.get('cache-control'), /s-maxage=30/);
  assert.ok(response.headers.get('etag'));
});

test('recommendation: weak version can 304 without body build', async () => {
  let built = 0;
  const version = await versionTokenFromValue({ m: 1 });
  const etag = weakEtag('schedule:s', version);
  const response = await conditionalJsonFromVersion(
    new Request('https://example.test/x', { headers: { 'if-none-match': etag } }),
    {
      scope: 'schedule:s',
      getVersion: async () => version,
      buildBody: async () => {
        built += 1;
        return { rounds: [] };
      },
    },
  );
  assert.equal(response.status, 304);
  assert.equal(built, 0);
});
