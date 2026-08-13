import assert from 'node:assert/strict';
import test from 'node:test';

import { injectPlayerCoreTheme, playerCoreThemeStyles } from '../src/playerCoreTheme.js';
import routerEntry from '../src/routerEntry.js';

test('core player theme scopes Schedule, Score, and Profile to light shared tokens', () => {
  assert.match(playerCoreThemeStyles, /main\.app:has\(\[data-season-select\]\)/);
  assert.match(playerCoreThemeStyles, /main\.app:has\(\[data-filters\]\)/);
  assert.match(playerCoreThemeStyles, /main\.app:has\(\[data-profile-form\]\)/);
  assert.match(playerCoreThemeStyles, /color-scheme: light/);
  assert.match(playerCoreThemeStyles, /\.match-actions a\.primary[\s\S]*--fd-primary-text/);
  assert.match(playerCoreThemeStyles, /\.status\[data-tone="ready"\][\s\S]*--fd-success-bg/);
  assert.match(playerCoreThemeStyles, /\.admin-actions a[\s\S]*--fd-border-control/);
  assert.match(playerCoreThemeStyles, /forced-colors: active/);
});

test('core player theme injects only for owned page hooks and only once', async () => {
  const source = '<!doctype html><html><head></head><body><main class="app"><select data-season-select></select></main></body></html>';
  const first = await injectPlayerCoreTheme(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const firstHtml = await first.text();
  assert.equal((firstHtml.match(/data-fd-player-core-theme/g) || []).length, 1);

  const second = await injectPlayerCoreTheme(new Response(firstHtml, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.equal(((await second.text()).match(/data-fd-player-core-theme/g) || []).length, 1);

  const unrelated = await injectPlayerCoreTheme(new Response('<html><head></head><body>plain</body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.doesNotMatch(await unrelated.text(), /data-fd-player-core-theme/);
});

test('runtime Schedule, Score picker, and Profile receive the shared core theme', async () => {
  for (const path of ['/schedule', '/scorecard', '/profile']) {
    const response = await routerEntry.fetch(new Request(`https://example.test${path}`), {}, {});
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /data-fd-player-core-theme/, path);
    assert.match(html, /data-fd-design-system/, path);
    assert.match(html, /data-fd-accessibility-layer/, path);
  }
});
