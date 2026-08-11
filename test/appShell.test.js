import assert from 'node:assert/strict';
import test from 'node:test';

import router from '../src/router.js';
import {
  decorateHtmlWithShell,
  isKnownAppPagePath,
  renderNotFoundPage,
  renderPrimaryNavigation,
} from '../src/appShell.js';

test('primary navigation marks the current section', () => {
  const html = renderPrimaryNavigation('/teams');
  assert.match(html, /href="\/teams" aria-current="page"/);
  assert.doesNotMatch(html, /href="\/standings" aria-current="page"/);
  assert.match(html, /class="fd-nav-menu"/);
});

test('shared shell decorates standalone pages exactly once', () => {
  const source = '<!doctype html><html><head><title>Test</title></head><body><main>Hello</main></body></html>';
  const first = decorateHtmlWithShell(source, '/profile');
  const second = decorateHtmlWithShell(first, '/profile');

  assert.match(first, /data-fd-shell/);
  assert.match(first, /href="\/profile" aria-current="page"/);
  assert.equal((second.match(/<header class="fd-shell"/g) || []).length, 1);
});

test('known app route allowlist covers ordinary delegated pages', () => {
  for (const path of [
    '/scorecard',
    '/standings',
    '/prizes',
    '/season-setup',
    '/lineup',
    '/profile',
    '/availability',
    '/teams',
    '/trades',
  ]) {
    assert.equal(isKnownAppPagePath(path), true, path);
  }

  assert.equal(isKnownAppPagePath('/definitely-missing'), false);
});

test('not-found page includes basset hound artwork and escapes the bad path', () => {
  const html = renderNotFoundPage('/bad/<b>');
  assert.match(html, /This dog lost the rack/);
  assert.match(html, /basset hound/i);
  assert.match(html, /&lt;b&gt;/);
  assert.doesNotMatch(html, /<span class="path">\/bad\/<b>/);
});

test('intro and rules use the same shared navigation shell', async () => {
  for (const path of ['/', '/rules']) {
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
