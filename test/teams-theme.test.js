import assert from 'node:assert/strict';
import test from 'node:test';

import { injectTeamsTheme, teamsThemeStyles } from '../src/teamsTheme.js';
import routerEntry from '../src/routerEntry.js';

test('Teams theme replaces legacy dark content with shared light tokens', () => {
  assert.match(teamsThemeStyles, /main\.app:has\(\[data-night-hub\]\)/);
  assert.match(teamsThemeStyles, /color-scheme: light/);
  assert.match(teamsThemeStyles, /\.panel,[\s\S]*--fd-bg-surface/);
  assert.match(teamsThemeStyles, /\.action-card--primary[\s\S]*--fd-bg-accent-soft/);
  assert.match(teamsThemeStyles, /\.danger[\s\S]*--fd-danger/);
  assert.match(teamsThemeStyles, /forced-colors: active/);
});

test('Teams theme injects only on Teams HTML and only once', async () => {
  const teams = '<!doctype html><html><head></head><body><main class="app"><section data-night-hub></section></main></body></html>';
  const first = await injectTeamsTheme(new Response(teams, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const firstHtml = await first.text();
  assert.equal((firstHtml.match(/data-fd-teams-theme/g) || []).length, 1);

  const second = await injectTeamsTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.equal(((await second.text()).match(/data-fd-teams-theme/g) || []).length, 1);

  const plain = await injectTeamsTheme(new Response('<html><head></head><body>plain</body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.doesNotMatch(await plain.text(), /data-fd-teams-theme/);
});

test('runtime Teams page receives the Teams convergence layer', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/teams'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-teams-theme/);
  assert.match(html, /data-fd-design-system/);
  assert.match(html, /data-fd-accessibility-layer/);
});
