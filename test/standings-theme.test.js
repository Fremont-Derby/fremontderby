import assert from 'node:assert/strict';
import test from 'node:test';

import { injectStandingsTheme, standingsThemeStyles } from '../src/standingsTheme.js';
import routerEntry from '../src/routerEntry.js';

test('Standings theme replaces the dark dashboard with shared light primitives', () => {
  assert.match(standingsThemeStyles, /body\[data-fd-standings-theme\][\s\S]*color-scheme: light/);
  assert.match(standingsThemeStyles, /\.tab\[aria-selected="true"\][\s\S]*--fd-primary-strong/);
  assert.match(standingsThemeStyles, /\.state-card,[\s\S]*--fd-bg-surface/);
  assert.match(standingsThemeStyles, /\.card-rank[\s\S]*--fd-green-100/);
  assert.match(standingsThemeStyles, /\.badge\.warn[\s\S]*--fd-warning-bg/);
  assert.match(standingsThemeStyles, /forced-colors: active/);
});

test('Standings theme is pathname scoped and idempotent', async () => {
  const source = '<!doctype html><html><head></head><body><main>Standings</main></body></html>';
  const first = await injectStandingsTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/standings');
  const firstHtml = await first.text();
  assert.match(firstHtml, /data-fd-standings-theme/);
  assert.equal((firstHtml.match(/data-fd-standings-theme-styles/g) || []).length, 1);

  const second = await injectStandingsTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/standings');
  assert.equal(((await second.text()).match(/data-fd-standings-theme-styles/g) || []).length, 1);

  const unrelated = await injectStandingsTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/teams');
  assert.doesNotMatch(await unrelated.text(), /data-fd-standings-theme-styles/);
});

test('runtime Standings receives theme after shared design system', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/standings'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-design-system[\s\S]*data-fd-standings-theme-styles/);
  assert.match(html, /data-fd-accessibility-layer/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /data-team-cards/);
  assert.match(html, /data-player-cards/);
});
