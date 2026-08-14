import assert from 'node:assert/strict';
import test from 'node:test';
import { injectPlayerSurfaceTheme, playerSurfaceThemeStyles } from '../src/playerSurfaceTheme.js';

test('player surface theme covers teams schedule and status chips', () => {
  assert.match(playerSurfaceThemeStyles, /data-fd-player-surface="teams"/);
  assert.match(playerSurfaceThemeStyles, /status-pill\[data-tone="live"\]/);
  assert.match(playerSurfaceThemeStyles, /padding-bottom: max\(92px/);
});

test('injectPlayerSurfaceTheme tags teams and messages paths', async () => {
  const base = new Response('<!doctype html><html><head></head><body><main>x</main></body></html>', {
    headers: { 'content-type': 'text/html' },
  });
  const teams = await injectPlayerSurfaceTheme(base.clone(), '/teams');
  const teamsHtml = await teams.text();
  assert.match(teamsHtml, /data-fd-player-surface="teams"/);
  assert.match(teamsHtml, /data-fd-player-surface-theme/);
  assert.match(teamsHtml, /theme-color" content="#f3f1ed"/);

  const messages = await injectPlayerSurfaceTheme(
    new Response('<!doctype html><html><head></head><body></body></html>', {
      headers: { 'content-type': 'text/html' },
    }),
    '/messages',
  );
  assert.match(await messages.text(), /data-fd-player-surface="messages"/);
});
