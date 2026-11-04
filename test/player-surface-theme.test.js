import assert from 'node:assert/strict';
import test from 'node:test';

import {
  injectPlayerSurfaceTheme,
  playerSurfaceThemeStyles,
} from '../src/playerSurfaceTheme.js';
import routerEntry from '../src/routerEntry.js';

test('player surface theme codifies the four P0 light-theme sign-off routes', () => {
  assert.match(playerSurfaceThemeStyles, /data-fd-player-surface="home"/);
  assert.match(playerSurfaceThemeStyles, /data-fd-player-surface="schedule"/);
  assert.match(playerSurfaceThemeStyles, /data-fd-player-surface="score-picker"/);
  assert.match(playerSurfaceThemeStyles, /data-fd-player-surface="profile"/);
  assert.match(playerSurfaceThemeStyles, /color-scheme: light !important/);
  assert.match(playerSurfaceThemeStyles, /var\(--fd-bg-page\)/);
  assert.match(playerSurfaceThemeStyles, /var\(--fd-bg-surface\)/);
  assert.match(playerSurfaceThemeStyles, /var\(--fd-primary-strong\)/);
  assert.match(playerSurfaceThemeStyles, /var\(--fd-control-min\)/);
  assert.match(playerSurfaceThemeStyles, /prefers-reduced-motion: reduce/);
  assert.match(playerSurfaceThemeStyles, /forced-colors: active/);
});

test('score picker residual dark cards are explicitly converged to shared surfaces', () => {
  assert.match(
    playerSurfaceThemeStyles,
    /data-fd-player-surface="score-picker"\] \.filters,[\s\S]*\.status,[\s\S]*\.empty,[\s\S]*\.match[\s\S]*var\(--fd-bg-surface\) !important/,
  );
  assert.match(
    playerSurfaceThemeStyles,
    /data-fd-player-surface="score-picker"\] \.filters select[\s\S]*var\(--fd-bg-surface\) !important/,
  );
});

test('player surface injection is HTML-only and limited to the four sign-off routes', async () => {
  const response = new Response('<!doctype html><html><head></head><body><main>ok</main></body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const themed = await injectPlayerSurfaceTheme(response, '/schedule');
  const html = await themed.text();
  assert.match(html, /data-fd-player-surface="schedule"/);
  assert.match(html, /data-fd-player-surface-theme/);

  const other = new Response('<!doctype html><html><head></head><body>teams</body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  const untouched = await injectPlayerSurfaceTheme(other, '/teams');
  assert.doesNotMatch(await untouched.text(), /data-fd-player-surface-theme/);

  const json = new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
  const jsonUntouched = await injectPlayerSurfaceTheme(json, '/profile');
  assert.equal(await jsonUntouched.text(), '{"ok":true}');
});

test('canonical browser pipeline applies light-theme sign-off after the shared design system', async () => {
  const surfaces = new Map([
    ['/', 'home'],
    ['/schedule', 'schedule'],
    ['/scorecard', 'score-picker'],
    ['/profile', 'profile'],
  ]);

  for (const [path, surface] of surfaces) {
    const response = await routerEntry.fetch(new Request(`https://example.test${path}`), {}, {});
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, new RegExp(`data-fd-player-surface="${surface}"`), path);
    assert.match(html, /data-fd-player-surface-theme/, path);
    assert.ok(
      html.indexOf('data-fd-design-system') < html.indexOf('data-fd-player-surface-theme'),
      `${path} player surface theme must follow the shared design system`,
    );
    assert.ok(
      html.lastIndexOf('color-scheme: light !important') > html.indexOf('color-scheme: dark'),
      `${path} light color scheme must override any page-local legacy declaration`,
    );
  }
});

test('home browser chrome follows the warm light page instead of the retired dark shell color', async () => {
  const response = await routerEntry.fetch(new Request('https://example.test/'), {}, {});
  const html = await response.text();
  assert.match(html, /<meta name="theme-color" content="#f3f1ed" \/>/);
  assert.doesNotMatch(html, /<meta name="theme-color" content="#07150f" \/>/);
});
