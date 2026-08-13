import assert from 'node:assert/strict';
import test from 'node:test';

import { injectPublicSurfaceTheme, publicSurfaceThemeStyles } from '../src/publicSurfaceTheme.js';
import routerEntry from '../src/routerEntry.js';
import { renderRulesPage } from '../src/publicPages.js';

test('public theme keeps Rules document-like and Test Drive visibly demo but light', () => {
  assert.match(publicSurfaceThemeStyles, /data-fd-public-surface="rules"[\s\S]*--fd-text/);
  assert.match(publicSurfaceThemeStyles, /data-fd-public-surface="rules"[\s\S]*\.public-page h2[\s\S]*--fd-primary-strong/);
  assert.match(publicSurfaceThemeStyles, /data-fd-public-surface="test-drive"[\s\S]*\.demo-banner[\s\S]*--fd-accent/);
  assert.match(publicSurfaceThemeStyles, /data-fd-public-surface="test-drive"[\s\S]*\.hero,[\s\S]*--fd-bg-surface/);
  assert.match(publicSurfaceThemeStyles, /min-height: 44px !important/);
  assert.match(publicSurfaceThemeStyles, /forced-colors: active/);
});

test('public surface theme is route-scoped and idempotent', async () => {
  const source = '<!doctype html><html><head></head><body><main>Public</main></body></html>';
  const first = await injectPublicSurfaceTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/demo');
  const firstHtml = await first.text();
  assert.match(firstHtml, /data-fd-public-surface="test-drive"/);
  assert.equal((firstHtml.match(/data-fd-public-surface-theme/g) || []).length, 1);

  const second = await injectPublicSurfaceTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/demo');
  assert.equal(((await second.text()).match(/data-fd-public-surface-theme/g) || []).length, 1);

  const unrelated = await injectPublicSurfaceTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }), '/teams');
  assert.doesNotMatch(await unrelated.text(), /data-fd-public-surface-theme/);
});

test('runtime Rules and Test Drive receive public convergence after shared design system', async () => {
  for (const path of ['/rules', '/demo']) {
    const response = await routerEntry.fetch(new Request(`https://example.test${path}`), {}, {});
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /data-fd-design-system[\s\S]*data-fd-public-surface-theme/, path);
    assert.match(html, /data-fd-accessibility-layer/, path);
  }
});

test('Rules keeps corrected postseason qualification and anchor wording', () => {
  const html = renderRulesPage();
  assert.match(html, /at least three players with four or more official regular-season matches for that team/);
  assert.match(html, /every other selected player must have at least three official matches for that team/);
  assert.match(html, /declares one anchor from the four players submitted/);
  assert.match(html, /two pre-declared anchors play the deciding handicapped anchor match/);
});
