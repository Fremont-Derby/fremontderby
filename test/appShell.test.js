import assert from 'node:assert/strict';
import test from 'node:test';

import router from '../src/router.js';
import {
  decorateHtmlWithShell,
  friendlyErrorMessage,
  isKnownAppPagePath,
  renderNotFoundPage,
  renderPrimaryNavigation,
} from '../src/appShell.js';

test('primary navigation marks the current section', () => {
  const html = renderPrimaryNavigation('/teams');
  assert.match(html, /href="\/teams"[^>]*aria-current="page"/);
  assert.doesNotMatch(html, /href="\/standings"[^>]*aria-current="page"/);
  assert.match(html, /class="fd-nav-menu"/);
});

test('shared navigation owns Schedule naming and Admin discovery directly', () => {
  const schedule = renderPrimaryNavigation('/schedule');
  const dock = schedule.match(/<nav class="fd-mobile-dock"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.match(dock, /fd-mobile-dock__ball" aria-hidden="true">9<\/span>\s*<span>Schedule<\/span>/);
  assert.doesNotMatch(dock, />Tonight<\/span>/);
  assert.equal((schedule.match(/href="\/admin" data-nav-key="admin"/g) || []).length, 2);

  const admin = renderPrimaryNavigation('/admin/season-teams');
  assert.equal((admin.match(/href="\/admin" data-nav-key="admin" aria-current="page" data-active="true">Admin<\/a>/g) || []).length, 2);
});

test('mobile quick navigation exposes frequent destinations with accessible active state', () => {
  const html = renderPrimaryNavigation('/lineup');
  const dock = html.match(/<nav class="fd-mobile-dock"[\s\S]*?<\/nav>/)?.[0] || '';
  assert.match(dock, /data-fd-mobile-dock/);
  assert.match(dock, /aria-label="Quick navigation"/);
  for (const destination of ['/teams', '/schedule', '/scorecard', '/messages', '/profile']) {
    assert.match(dock, new RegExp(`href="${destination.replace('/', '\\/')}"`));
  }
  assert.doesNotMatch(dock, /href="\/rules"/);
  assert.doesNotMatch(dock, /href="\/demo"/);
  assert.doesNotMatch(dock, /data-nav-key="admin"/);
  assert.match(dock, /href="\/teams"[^>]*aria-current="page"/);
  assert.match(dock, /data-nav-key="teams"/);
  assert.match(dock, /data-nav-key="schedule"/);
  assert.doesNotMatch(dock, /data-nav-key="standings"/);
  assert.match(dock, /data-nav-key="score"/);
  assert.match(dock, /data-nav-key="messages"/);
  assert.match(dock, /data-nav-key="profile"/);
});

test('live scorecard keeps the reduced shell without the fixed mobile dock', () => {
  const navigation = renderPrimaryNavigation('/scorecard');
  assert.doesNotMatch(navigation, /data-fd-mobile-dock/);

  const source = '<!doctype html><html><head><title>Score</title></head><body><main>Score</main></body></html>';
  const html = decorateHtmlWithShell(source, '/scorecard');
  assert.doesNotMatch(html, /<div class="fd-mobile-dock-spacer"/);
});

test('shared shell decorates standalone pages exactly once', () => {
  const source = '<!doctype html><html><head><title>Test</title></head><body><main>Hello</main></body></html>';
  const first = decorateHtmlWithShell(source, '/profile');
  const second = decorateHtmlWithShell(first, '/profile');

  assert.match(first, /data-fd-shell/);
  assert.match(first, /href="\/profile"[^>]*aria-current="page"/);
  assert.match(first, /<div class="fd-mobile-dock-spacer"/);
  assert.equal((second.match(/<header class="fd-shell"/g) || []).length, 1);
});

test('shared shell keeps failed actions visible in a dismissible error pop-up', () => {
  const source = '<!doctype html><html><head><title>Test</title></head><body><main><div data-status></div></main></body></html>';
  const html = decorateHtmlWithShell(source, '/messages');

  assert.match(html, /data-error-popup/);
  assert.match(html, /role="alert"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /data-error-popup-close/);
  assert.match(html, /position: fixed/);
  assert.match(html, /MutationObserver/);
  assert.match(html, /data-tone="error"/);
  assert.match(html, /fd:error/);
});

test('technical failures are replaced with plain customer guidance', () => {
  assert.equal(
    friendlyErrorMessage('Supabase request failed with 403: permission denied for schema private'),
    'We could not complete that action. Nothing was changed. Please try again.',
  );
  assert.equal(
    friendlyErrorMessage('Choose all three active players.'),
    'Choose all three active players.',
  );
  assert.equal(
    friendlyErrorMessage('Your sign-in expired.'),
    'Your sign-in expired. Open Profile, sign in again, and retry.',
  );
});

test('known app route allowlist covers ordinary delegated pages', () => {
  for (const path of [
    '/scorecard',
    '/schedule',
    '/standings',
    '/prizes',
    '/season-setup',
    '/lineup',
    '/profile',
    '/availability',
    '/teams',
  ]) {
    assert.equal(isKnownAppPagePath(path), true, path);
  }

  assert.equal(isKnownAppPagePath('/trades'), true);
  assert.equal(isKnownAppPagePath('/definitely-missing'), false);
});

test('retired Trades route stays on the normal 404 path', async () => {
  const response = await router.fetch(
    new Request('https://fremontderby.test/trades'),
    {},
    {},
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Fremont Derby Trades/);
});

test('not-found page includes basset hound artwork and escapes the bad path', () => {
  const html = renderNotFoundPage('/bad/<b>');
  assert.match(html, /This dog lost the rack/);
  assert.match(html, /basset hound/i);
  assert.match(html, /&lt;b&gt;/);
  assert.doesNotMatch(html, /<span class="path">\/bad\/<b>/);
});

test('intro and rules use the same shared navigation shell', async () => {
  for (const path of ['/', '/rules', '/schedule']) {
    const response = await router.fetch(
      new Request(`https://fremontderby.test${path}`),
      {},
      {},
    );
    const html = await response.text();

    assert.equal(response.status, 200, path);
    assert.equal((html.match(/<header class="fd-shell"/g) || []).length, 1, path);
    assert.doesNotMatch(html, /aria-label="Main navigation"/, path);
    assert.match(html, /aria-label="Primary navigation"/, path);
  }
});
