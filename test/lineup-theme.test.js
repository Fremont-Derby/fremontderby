import assert from 'node:assert/strict';
import test from 'node:test';

import { injectLineupTheme, lineupThemeStyles } from '../src/lineupTheme.js';
import routerEntry from '../src/routerEntry.js';

test('captain Lineup theme converts normal workflow surfaces to the shared light contract', () => {
  assert.match(lineupThemeStyles, /body\[data-fd-lineup-theme\][\s\S]*color-scheme: light/);
  assert.match(lineupThemeStyles, /\.mobile-lineup-summary,[\s\S]*--fd-bg-surface/);
  assert.match(lineupThemeStyles, /\.badge\.available,[\s\S]*--fd-success-bg/);
  assert.match(lineupThemeStyles, /\.badge\.unsure[\s\S]*--fd-warning-bg/);
  assert.match(lineupThemeStyles, /\.badge\.unavailable,[\s\S]*--fd-danger-bg/);
  assert.match(lineupThemeStyles, /\.status\[data-tone="error"\][\s\S]*--fd-danger-bg/);
  assert.match(lineupThemeStyles, /forced-colors: active/);
});

test('Lineup theme is scoped to the canonical captain route and idempotent', async () => {
  const source = '<!doctype html><html><head></head><body><main>Lineup</main></body></html>';
  const first = await injectLineupTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/lineup');
  const firstHtml = await first.text();
  assert.match(firstHtml, /data-fd-lineup-theme/);
  assert.equal((firstHtml.match(/data-fd-lineup-theme-styles/g) || []).length, 1);

  const second = await injectLineupTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/lineup');
  assert.equal(((await second.text()).match(/data-fd-lineup-theme-styles/g) || []).length, 1);

  const unrelated = await injectLineupTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/scorecard');
  assert.doesNotMatch(await unrelated.text(), /data-fd-lineup-theme-styles/);
});

test('runtime captain Lineup keeps the sticky low-scroll workflow while receiving light theme', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/lineup'), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-fd-design-system[\s\S]*data-fd-lineup-theme-styles/);
  assert.match(html, /data-fd-accessibility-layer/);
  assert.match(html, /Pick your three/);
  assert.match(html, /data-mobile-lineup-summary/);
  assert.match(html, /data-player-search/);
  assert.match(html, /data-submit/);
  assert.match(html, /data-refresh/);
  assert.match(html, /data-score-link/);
  assert.match(html, /position:sticky/);
});
