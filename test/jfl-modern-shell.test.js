import test from 'node:test';
import assert from 'node:assert/strict';

import { renderPrimaryNavigation } from '../src/appShell.js';
import router from '../src/routerEntry.js';
import {
  decorateJflModernShell,
  jflModernShellStyles,
  MODERN_PRIMARY_DESTINATIONS,
  MODERN_SECONDARY_DESTINATIONS,
} from '../src/jflModernShell.js';

const PRIMARY_HREFS = ['/', '/teams', '/schedule', '/messages', '/profile'];

function htmlResponse(pathname = '/schedule') {
  return new Response(`<!doctype html><html lang="en"><head><title>Shell test</title></head><body>${renderPrimaryNavigation(pathname)}<main><h1>Existing body</h1></main></body></html>`, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function hrefsFrom(markup) {
  return [...markup.matchAll(/<a\s+[^>]*href="([^"]+)"/g)].map((match) => match[1]);
}

test('modern shell defines exactly the approved five primary destinations in order', () => {
  assert.deepEqual(MODERN_PRIMARY_DESTINATIONS.map((item) => item.href), PRIMARY_HREFS);
  assert.equal(MODERN_PRIMARY_DESTINATIONS.length, 5);
  assert.ok(MODERN_SECONDARY_DESTINATIONS.some((item) => item.href === '/scorecard'));
  assert.ok(MODERN_SECONDARY_DESTINATIONS.some((item) => item.href === '/availability'));
  assert.ok(MODERN_SECONDARY_DESTINATIONS.some((item) => item.href === '/lineup'));
  assert.ok(MODERN_SECONDARY_DESTINATIONS.some((item) => item.href === '/standings'));
  assert.ok(MODERN_SECONDARY_DESTINATIONS.some((item) => item.href === '/rules'));
  assert.ok(MODERN_SECONDARY_DESTINATIONS.some((item) => item.href === '/admin'));
});

test('JFL shell renders five-item mobile dock, secondary navigation, current-page semantics, and identity', async () => {
  const request = new Request('https://jfl.fremontderby.com/schedule');
  const response = await decorateJflModernShell(
    htmlResponse('/schedule'),
    request,
    { ENVIRONMENT: 'jfl', DEPLOY_GIT_SHA: '1234567890abcdef' },
  );

  assert.equal(response.headers.get('x-fremont-ui-shell'), 'modern-v1');
  const html = await response.text();
  const shellTag = html.match(/<header class="fd-shell"[^>]*>/)?.[0] || '';
  const shellStyleTag = html.match(/<style[^>]*data-fd-shell-styles[^>]*>/)?.[0] || '';
  assert.match(shellTag, /data-fd-modern-shell="true"/);
  assert.doesNotMatch(shellStyleTag, /data-fd-modern-shell/);
  assert.match(html, /data-fd-jfl-environment/);
  assert.match(html, />JFL</);
  assert.match(html, /1234567/);
  assert.match(html, /data-message-indicator/);
  assert.match(html, /data-message-badge/);

  const dock = html.match(/<nav class="fd-mobile-dock[\s\S]*?<\/nav>/)?.[0] || '';
  assert.deepEqual(hrefsFrom(dock), PRIMARY_HREFS);
  assert.match(dock, /href="\/schedule"[^>]*aria-current="page"/);
  assert.doesNotMatch(dock, /\/scorecard|\/standings|\/rules|\/admin|\/availability|\/lineup/);

  const more = html.match(/<details[^>]+data-fd-more-menu[\s\S]*?<\/details>/)?.[0] || '';
  assert.match(more, /aria-label="More navigation"/);
  for (const href of ['/scorecard', '/availability', '/lineup', '/standings', '/prizes', '/rules', '/admin']) {
    assert.match(more, new RegExp(`href=["']${href.replace('/', '\\/')}["']`), `missing ${href} from More menu`);
  }
});

test('secondary routes retain aria-current semantics without polluting the five-item dock', async () => {
  const response = await decorateJflModernShell(
    htmlResponse('/scorecard'),
    new Request('https://jfl.fremontderby.com/scorecard'),
    { ENVIRONMENT: 'jfl', DEPLOY_GIT_SHA: 'abcdef1234567890' },
  );
  const html = await response.text();
  const dock = html.match(/<nav class="fd-mobile-dock[\s\S]*?<\/nav>/)?.[0] || '';
  const more = html.match(/<details[^>]+data-fd-more-menu[\s\S]*?<\/details>/)?.[0] || '';
  assert.deepEqual(hrefsFrom(dock), PRIMARY_HREFS);
  assert.match(more, /href="\/scorecard"[^>]*aria-current="page"/);
  assert.match(more, /data-active="true"/);
});

test('modern shell keeps keyboard/touch and forced-colors accessibility contracts', () => {
  assert.match(jflModernShellStyles, /:focus-visible/);
  assert.match(jflModernShellStyles, /min-height:\s*44px/);
  assert.match(jflModernShellStyles, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(jflModernShellStyles, /prefers-reduced-motion/);
  assert.match(jflModernShellStyles, /background:\s*#073c28\s*!important/);
  assert.match(jflModernShellStyles, /data-fd-more-menu.*> summary/);
  assert.match(jflModernShellStyles, /-webkit-text-fill-color:\s*#fff\s*!important/);
  assert.match(jflModernShellStyles, /\.fd-more-menu\[open\] summary/);
});

test('JFL shell can fail back to legacy and never changes non-JFL environments', async () => {
  const original = await htmlResponse('/schedule').text();

  const legacyResponse = await decorateJflModernShell(
    htmlResponse('/schedule'),
    new Request('https://jfl.fremontderby.com/schedule?shell=legacy'),
    { ENVIRONMENT: 'jfl', DEPLOY_GIT_SHA: 'abcdef1234567890' },
  );
  assert.equal(legacyResponse.headers.get('x-fremont-ui-shell'), 'legacy');
  assert.equal(await legacyResponse.text(), original);

  for (const environment of ['production', 'gamma', 'dru']) {
    const response = await decorateJflModernShell(
      htmlResponse('/schedule'),
      new Request('https://example.test/schedule'),
      { ENVIRONMENT: environment, DEPLOY_GIT_SHA: 'abcdef1234567890' },
    );
    assert.equal(response.headers.get('x-fremont-ui-shell'), null);
    assert.equal(await response.text(), original);
  }
});

test('routerEntry applies the modern shell to the static JFL design-system route', async () => {
  const response = await router.fetch(
    new Request('https://jfl.fremontderby.com/design-system'),
    { ENVIRONMENT: 'jfl', DEPLOY_GIT_SHA: '7654321abcdef000' },
    {},
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-fremont-ui-shell'), 'modern-v1');
  const html = await response.text();
  assert.match(html, /data-fd-modern-shell="true"/);
  assert.match(html, /7654321/);
});
